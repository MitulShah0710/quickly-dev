const middy = require('middy')
const { middleware } = require("../sequelize-middleware");
// const { sendResponse } = require("../libs/api-gateway-libs")
const { DB_SCHEMA } = process.env;

const handler = middy(async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false
    const sequelize = context.models.sequelize
    
    //const { v1, v2 } = arguments

    try {
        const jsonObj= await getQueryJsonObject(event.arguments.filterContent);
        var whereText=await getQueryText(jsonObj);
        //var queryText=`SELECT Task.*,'[{"ID":"'||TaskType."ID"||'","name":"'||TaskType."name"||'"}]' as "TaskType" FROM ${DB_SCHEMA}."Tasks" Task INNER JOIN ${DB_SCHEMA}."TaskTypes" TaskType on TaskType."ID" = Task."TaskTypeID" WHERE `+whereText;
        var queryText= `
        SELECT 
        Task.*,
        TaskType."ID" as "TaskTypeID",
        TaskType."name" as "TaskTypeName",
        Team."name" as "TeamName",
        Team."ID" as "TeamId",
        ( (SELECT json_agg(json_build_object('status',Ts."status",'timestamp',Ts."timestamp")) FROM test."TaskHistories" as Ts WHERE "TaskID"=Task."ID")) as "TaskHistories"      
        FROM ${DB_SCHEMA}."Tasks" Task 
        INNER JOIN ${DB_SCHEMA}."TaskTypes" TaskType on TaskType."ID" = Task."TaskTypeID"
        INNER JOIN ${DB_SCHEMA}."Teams" AS Team ON
          Team."ID" = Task."TeamID" WHERE `+whereText;
        console.log(queryText)
        const [results, metadata] = await sequelize.query(queryText);
       // results=results.replace(/\\/g, '');
        results.forEach(element => {
            element.TaskType={ID:0,name:''}
            element.Team={ID:0,name:''}
            element.TaskType.ID=element.TaskTypeID;
            element.TaskType.name=element.TaskTypeName;
            element.Team.ID=element.TeamId;
            element.Team.name=element.TeamName;
        });
        console.log("results:\n", JSON.stringify(results))
        
        return {
            tasks: results,
            count:results.length
        }
    } catch (e) {
        console.log('error caught', e)
        throw e
    }
});

async function getQueryJsonObject(initialText){
    console.log("Entra a armar consulta");
    console.log(initialText)
    initialText=initialText.replace(/&/g,':');
    initialText=initialText.replace(/#/g,'"');   
    return obj=JSON.parse(initialText);   
}
async function getQueryText(jsonObject){
    var whereTxt="";
    var count=0;
    
    jsonObject.groups.forEach(element => {
        
        if(element.isFirst.toString()=='false'){
            whereTxt+='--'+element.connector+' '  
        }
        whereTxt+='('
        var items=jsonObject.items.filter(x=>x.groupId==element.id);
        items.forEach(item => {
            
            if(item.isFirst.toString()=='false'){
                whereTxt+=" "+item.connector+' '  
            }
            whereTxt+=" \""+item.field+"\" "+item.opt;
            if(item.opt=='like'){
                whereTxt+=" '%"+item.value1+"%' ";
            }else{
                if(item.value1!=''){
                    whereTxt+=" '"+item.value1+"' ";
                }
                if(item.value2!=''){
                    whereTxt+=' AND '+item.value2;
                }
            }
            
        });
        whereTxt+=')'
    });
    console.log("texto final")
    console.log(whereTxt)
    return whereTxt;
}
handler.use({
    before: middleware
})


module.exports = { handler }