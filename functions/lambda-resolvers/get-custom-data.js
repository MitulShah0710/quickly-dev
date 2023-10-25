const middy = require('middy')
const { middleware } = require("./sequelize-middleware");
// const { sendResponse } = require("../libs/api-gateway-libs")
const { DB_SCHEMA } = process.env;
var functions= [] ;

const handler = middy(async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false
    console.log('Incoming event', JSON.stringify(event))

    const sequelize = context.models.sequelize
    const { arguments, tenantHash } = event
    const { v1, v2 } = arguments

  

    try {
        await getVaues();
        console.log("funciones",functions.length);
        var current=functions.find(x=>x.name==v1);
        console.log("current",current);
        console.log("ESquema",DB_SCHEMA);
        if(current){
                
               // console.log(" intenando");
         await sequelize.query(current.code);
         //console.log("Terminado");

        }
        
       
        const [results, metadata] = await sequelize.query(`SELECT ${DB_SCHEMA}.\"${v1}\"(\'${tenantHash}\', \'${v2}\')`);
        console.log("results:\n", JSON.stringify(results))
        return JSON.stringify(results);
    } catch (e) {
        console.log('error caught', JSON.stringify(e))
        throw e
    }
})

handler.use({
    before: middleware
})
async function getVaues() {
        functions= [] ;
       
    functions.push({name:"calculate_dashboard",code: 
                `
        -- FUNCTION: ${DB_SCHEMA}.calculate_dashboard(character varying, character varying)

        -- DROP FUNCTION IF EXISTS ${DB_SCHEMA}.calculate_dashboard(character varying, character varying);

        CREATE OR REPLACE FUNCTION ${DB_SCHEMA}.calculate_dashboard(
            v1 character varying,
            v2 character varying)
            RETURNS json
            LANGUAGE 'plpgsql'
            COST 100
            VOLATILE PARALLEL UNSAFE
        AS $BODY$
        DECLARE
            pre_json json;
            result_json json;
            datefrom varchar(12);
            dateend varchar(12);
            agentid varchar;
            teamid varchar;
            querywhere varchar;
        BEGIN
        /*Transform parameters json for filters*/
        SELECT A.param->'date-from' as datefrom,
            A.param->'date-end' as dateend,
            A.param->'agentid' as agentid,
            A.param->'teamid' as teamid
        FROM (SELECT v2::json as param) A
        INTO datefrom,dateend,agentid,teamid;

        raise notice 'dateFrom: %', REPLACE(datefrom,'"','');
        raise notice 'dateEnd: %', REPLACE(dateend,'"','');
        raise notice 'agentID: %', REPLACE(agentid,'"','');
        raise notice 'teamID: %', REPLACE(teamid,'"','');
        teamid=REPLACE(teamid,'"','');

        querywhere='';
        if teamid<>'' then
        querywhere=querywhere || ' AND "TeamID"='''||teamid||'''';
        end if;
        if datefrom<>'' then
        querywhere=querywhere || ' AND "plannedDate">='''||datefrom||'''';
        end if;
        if dateend<>'' then
        querywhere=querywhere || ' AND "plannedDate"<CAST('''||dateend||''' AS DATE) + CAST(''1 days'' AS INTERVAL)';
        end if;


        CREATE TEMP TABLE results(orden int,type_value varchar,name_indicator varchar,
                                value1 varchar,value2 varchar,direction int,color varchar,icon varchar);
        --1 as ORDEN,''INDICATOR'' as TypeValue, ''gest_ok_value'' AS Indicator,A.Total AS Value1,0 AS Direction,
        --''''as Color, ''''  as Icon

        /*GetData Indicadores
        EXECUTE 'SELECT json_agg(jsonQuery)
                FROM (SELECT json_build_object(''ID'',id,''name'',name) as jsonQuery
                    FROM (SELECT "ID" as id, "taskDescription" as name 
                            FROM ${DB_SCHEMA}."Tasks"
                            WHERE "TenantID"='''||v1||'''
                                    AND "TeamID"='''||teamid||''') A)B'
        INTO result_json;*/

        /*total_task*/
        EXECUTE 'INSERT INTO results (orden,type_value,name_indicator,value1,value2,direction,color,icon)
                SELECT 1 as orden,''INDICATOR'' as type_value, ''total_task'' as name_indicator,
                        count(*) as value1, 0 as value2,
                        0 as direction,'''' as color,'''' as icon
                FROM ${DB_SCHEMA}."Tasks"
                WHERE "TenantID"='''||v1||''' '||querywhere;
                
        /*porc_total_completed_task*/				
        EXECUTE 'INSERT INTO results (orden,type_value,name_indicator,value1,value2,direction,color,icon)
                SELECT 1 as orden,''INDICATOR'' as type_value, ''porc_total_completed_task'' as name_indicator,
                        SUM(CASE WHEN "taskStatus"=''COMPLETED'' THEN 1 
                                WHEN "taskStatus"=''PARTIALLY_COMPLETED'' THEN 1 
                                ELSE 0 
                            END) as value1,
                        SUM(CASE WHEN "taskStatus"=''COMPLETED'' THEN 1 
                                WHEN "taskStatus"=''PARTIALLY_COMPLETED'' THEN 1 
                                ELSE 0 
                            END)*100/COUNT(*) as value2,
                        0 as direction,'''' as color,'''' as icon
                FROM ${DB_SCHEMA}."Tasks"
                WHERE "TenantID"='''||v1||''' '||querywhere;	
                
        /*porc_total_rejected_task*/				
        EXECUTE 'INSERT INTO results (orden,type_value,name_indicator,value1,value2,direction,color,icon)
                SELECT 1 as orden,''INDICATOR'' as type_value, ''porc_total_rejected_task'' as name_indicator,
                        SUM(CASE WHEN "taskStatus"=''REJECTED'' THEN 1 
                                ELSE 0 
                            END) as value1,
                        SUM(CASE WHEN "taskStatus"=''REJECTED'' THEN 1 
                                ELSE 0 
                            END)*100/COUNT(*) as value2,
                        0 as direction,'''' as color,'''' as icon
                FROM ${DB_SCHEMA}."Tasks"
                WHERE "TenantID"='''||v1||''' '||querywhere;	
                
        /*porc_total_cancelled_task*/				
        EXECUTE 'INSERT INTO results (orden,type_value,name_indicator,value1,value2,direction,color,icon)
                SELECT 1 as orden,''INDICATOR'' as type_value, ''porc_total_cancelled_task'' as name_indicator,
                        SUM(CASE WHEN "taskStatus"=''CANCELLED'' THEN 1 
                                ELSE 0 
                            END) as value1,
                        SUM(CASE WHEN "taskStatus"=''CANCELLED'' THEN 1 
                                ELSE 0 
                            END)*100/COUNT(*) as value2,
                        0 as direction,'''' as color,'''' as icon
                FROM ${DB_SCHEMA}."Tasks"
                WHERE "TenantID"='''||v1||''' '||querywhere;	
                    
        /*average_task_completion_time*/				
        EXECUTE 'INSERT INTO results (orden,type_value,name_indicator,value1,value2,direction,color,icon)
                SELECT 1 as orden,''INDICATOR'' as type_value, ''average_task_completion_time'' as name_indicator,
                        SUM("deliveryDate"-"plannedDate") / count(*) as value1,
                        0 as value2,
                        0 as direction,'''' as color,'''' as icon
                FROM ${DB_SCHEMA}."Tasks"
                WHERE "taskStatus" IN (''COMPLETED'',''PARTIALLY_COMPLETED'')AND "deliveryDate" IS NOT NULL AND 
                    "TenantID"='''||v1||''' '||querywhere;		

        /*task_executed_on_time*/
        EXECUTE 'INSERT INTO results (orden,type_value,name_indicator,value1,value2,direction,color,icon)
                SELECT 1 as orden,''INDICATOR'' as type_value, ''average_task_executed_on_time'' as name_indicator,
                        SUM(CASE WHEN "deliveryDate"<="plannedDate" AND "taskStatus" IN (''COMPLETED'',''PARTIALLY_COMPLETED'') AND "deliveryDate" IS NOT NULL THEN 1 
                                ELSE 0 END) / count(*) as value1,
                        0 as value2,
                        0 as direction,'''' as color,'''' as icon
                FROM ${DB_SCHEMA}."Tasks"
                WHERE "TenantID"='''||v1||''' '||querywhere;		

        /*Average task Acceptance time */
        /*EXECUTE 'INSERT INTO results (orden,type_value,name_indicator,value1,value2,direction,color,icon)
                SELECT 1 as orden,''INDICATOR'' as type_value, ''average_task_executed_on_time'' as name_indicator,
                        SUM("date_accepted"-"plannedDate") / count(*) as value1,
                        0 as value2,
                        0 as direction,'''' as color,'''' as icon
                FROM ${DB_SCHEMA}."Tasks" as task INNER JOIN
                        (SELECT "TaskID", MIN(timestamp) as date_accepted
                        FROM ${DB_SCHEMA}."TaskHistories"
                        WHERE status=''ACCEPTED''
                        GROUP BY "TaskID") as th ON task."ID"=th."TaskID"
                WHERE task."TenantID"='''||v1||''' '||querywhere;*/	


        EXECUTE 'SELECT json_agg(jsonQuery)
                FROM (SELECT json_build_object(''orden'',orden,''type_value'',type_value,''name_indicator'',name_indicator,
                                                ''value1'',value1,''value2'',value2,''direction'',direction,''color'',color,''icon'',icon) as jsonQuery
                    FROM results)B'
        INTO result_json;

        DROP TABLE results;

        RETURN result_json;
        END
        $BODY$;

        ALTER FUNCTION ${DB_SCHEMA}.calculate_dashboard(character varying, character varying)
            OWNER TO quickly;

            `
        });

        functions.push({name:"calculate_dashboard_chart",code: ` 
        -- FUNCTION: ${DB_SCHEMA}.calculate_dashboard(character varying, character varying)

        -- DROP FUNCTION IF EXISTS ${DB_SCHEMA}.calculate_dashboard(character varying, character varying);
        
        CREATE OR REPLACE FUNCTION ${DB_SCHEMA}.calculate_dashboard_chart(
                v1 character varying,
                v2 character varying)
            RETURNS json
            LANGUAGE 'plpgsql'
            COST 100
            VOLATILE PARALLEL UNSAFE
        AS $BODY$
        DECLARE
                pre_json json;
                result_json json;
                datefrom varchar(12);
                dateend varchar(12);
                agentid varchar;
                teamid varchar;
                indicator_current varchar;
                querywhere varchar;
        BEGIN
        /*Transform parameters json for filters*/
        SELECT A.param->'date-from' as datefrom,
                   A.param->'date-end' as dateend,
                   A.param->'agentid' as agentid,
                   A.param->'teamid' as teamid,
                   A.param->'indicator_current' as indicator_current
        FROM (SELECT v2::json as param) A
        INTO datefrom,dateend,agentid,teamid,indicator_current;
        
        raise notice 'dateFrom: %', REPLACE(datefrom,'"','');
        raise notice 'dateEnd: %', REPLACE(dateend,'"','');
        raise notice 'agentID: %', REPLACE(agentid,'"','');
        raise notice 'teamID: %', REPLACE(teamid,'"','');
        raise notice 'indicator_current: %', REPLACE(indicator_current,'"','');
        
        indicator_current=REPLACE(indicator_current,'"','');
        teamid=REPLACE(teamid,'"','');
        
        querywhere='';
        if teamid<>'' then
           querywhere=querywhere || ' AND "TeamID"='''||teamid||'''';
        end if;
        if datefrom<>'' then
           querywhere=querywhere || ' AND "plannedDate">='''||datefrom||'''';
        end if;
        if dateend<>'' then
           querywhere=querywhere || ' AND "plannedDate"<CAST('''||dateend||''' AS DATE) + CAST(''1 days'' AS INTERVAL)';
        end if;
        
        
        CREATE TEMP TABLE results(orden int,type_value varchar,name_indicator varchar,
                                                          label varchar, value1 varchar,value2 int,color varchar);
        
        if indicator_current='0' then	
                /*Indicator "Qty and % Completed Tasks" - Team*/
                EXECUTE 'INSERT INTO results (orden,type_value,name_indicator,label,value1,value2,color)
                                 SELECT 0 as orden,''CHART'' as type_value, ''chart_bar_one'' as name_indicator,
                                             teamDesc AS label, total_completed as value1, 0 as value2,'''' as color
                                 FROM (SELECT "name" as teamDesc, 
                                                          SUM(CASE WHEN "taskStatus"=''COMPLETED'' THEN 1 
                                                                             WHEN "taskStatus"=''PARTIALLY_COMPLETED'' THEN 1 
                                                                           ELSE 0 
                                                                  END) as total_completed		
                                                 FROM ${DB_SCHEMA}."Tasks" as task INNER JOIN
                                                          ${DB_SCHEMA}."Teams" as Team ON Task."TeamID"=Team."ID"
                                                 WHERE task."TenantID"='''||v1||''' '||querywhere|| '
                                                 GROUP BY "name") as ta
                                 ORDER BY teamDesc DESC
                                 LIMIT 10';	
        
                /*Indicator "Number of task" - Status*/
                EXECUTE 'INSERT INTO results (orden,type_value,name_indicator,label,value1,value2,color)
                                 SELECT 2 as orden,''CHART'' as type_value, ''chart_pie'' as name_indicator,
                                                "taskStatus" AS label, count(*) as value1,0 as value2,
                                                CASE WHEN "taskStatus"=''NOT_ASSIGNED'' THEN ''#C6C6C6''
                                                         WHEN "taskStatus"=''PENDING_ACCEPTANCE'' THEN ''#67B1F6''
                                                         WHEN "taskStatus"=''ASSIGNED'' THEN ''#2E67FA''
                                                         WHEN "taskStatus"=''ACCEPTED'' THEN ''#2E67FA''
                                                         WHEN "taskStatus"=''IN_TRANSIT'' THEN ''#CFB704''
                                                         WHEN "taskStatus"=''ON_SITE'' THEN ''#2CE25F''
                                                         WHEN "taskStatus"=''COMPLETED'' THEN ''#2B890A''
                                                         WHEN "taskStatus"=''PARTIALLY_COMPLETED'' THEN ''#2B890A''
                                                         WHEN "taskStatus"=''REJECTED'' THEN ''#F34C3E''
                                                         WHEN "taskStatus"=''CANCELLED'' THEN ''#F34C3E''
                                                END as color
                                 FROM ${DB_SCHEMA}."Tasks" as task
                                 WHERE "TenantID"='''||v1||''' '||querywhere|| '
                                 GROUP BY "taskStatus"
                                 ORDER BY "taskStatus" ASC';
        end if;
        
        if indicator_current='1' then
                /*Indicator "Number of task" - Date*/
                EXECUTE 'INSERT INTO results (orden,type_value,name_indicator,label,value1,value2,color)
                                 SELECT 1 as orden,''CHART'' as type_value, ''chart_line'' as name_indicator,
                                                to_char("plannedDate", ''YYYY/MM/DD'') AS label, count(*) as value1,0 as value2,'''' as color
                                 FROM ${DB_SCHEMA}."Tasks" as task
                                 WHERE "TenantID"='''||v1||''' '||querywhere|| '
                                 GROUP BY to_char("plannedDate", ''YYYY/MM/DD'')
                                 ORDER BY to_char("plannedDate", ''YYYY/MM/DD'') ASC';
                /*Indicator "Number of task" - Status*/
                EXECUTE 'INSERT INTO results (orden,type_value,name_indicator,label,value1,value2,color)
                                 SELECT 2 as orden,''CHART'' as type_value, ''chart_pie'' as name_indicator,
                                                "taskStatus" AS label, count(*) as value1,0 as value2,
                                                CASE WHEN "taskStatus"=''NOT_ASSIGNED'' THEN ''#FFFFFF''
                                                         WHEN "taskStatus"=''PENDING_ACCEPTANCE'' THEN ''#67B1F6''
                                                         WHEN "taskStatus"=''ASSIGNED'' THEN ''#2E67FA''
                                                         WHEN "taskStatus"=''ACCEPTED'' THEN ''#2E67FA''
                                                         WHEN "taskStatus"=''IN_TRANSIT'' THEN ''#FEFF02''
                                                         WHEN "taskStatus"=''ON_SITE'' THEN ''#2CE25F''
                                                         WHEN "taskStatus"=''COMPLETED'' THEN ''#2B890A''
                                                         WHEN "taskStatus"=''PARTIALLY_COMPLETED'' THEN ''#2B890A''
                                                         WHEN "taskStatus"=''REJECTED'' THEN ''#F34C3E''
                                                         WHEN "taskStatus"=''CANCELLED'' THEN ''#F34C3E''
                                                END as color
                                 FROM ${DB_SCHEMA}."Tasks" as task
                                 WHERE "TenantID"='''||v1||''' '||querywhere|| '
                                 GROUP BY "taskStatus"
                                 ORDER BY "taskStatus" ASC';
                /*--------------------------------------------------------------------------------------*/
        end if;
        
        if indicator_current='2' then
                /*Indicator "Qty and % Completed Tasks" - Agent*/
                /*EXECUTE 'INSERT INTO results (orden,type_value,name_indicator,label,value1,value2,color)
                                 SELECT 3 as orden,''CHART'' as type_value, ''chart_bar_one'' as name_indicator,
                                             agentDesc AS label, porc_completed as value1, 0 as value2,'''' as color
                                 FROM (SELECT (Agent."firstName"||'' ''||Agent."lastName") as agentDesc, 
                                                          SUM(CASE WHEN "taskStatus"=''COMPLETED'' THEN 1 
                                                                             WHEN "taskStatus"=''PARTIALLY_COMPLETED'' THEN 1 
                                                                           ELSE 0 
                                                                  END)*100/count(*) as porc_completed		
                                                 FROM ${DB_SCHEMA}."Tasks" as task INNER JOIN
                                                          ${DB_SCHEMA}."Agents" as Agent ON Task."AgentID"=Agent."ID"
                                                 WHERE Task."TenantID"='''||v1||''' '||querywhere|| '
                                                 GROUP BY (Agent."firstName"||'' ''||Agent."lastName")) as ta
                                 ORDER BY porc_completed DESC
                                 LIMIT 10';		*/
                /*Indicator "Qty and % Completed Tasks" - Team*/
                EXECUTE 'INSERT INTO results (orden,type_value,name_indicator,label,value1,value2,color)
                                 SELECT 4 as orden,''CHART'' as type_value, ''chart_bar_one'' as name_indicator,
                                             teamDesc AS label, porc_completed as value1, 0 as value2,'''' as color
                                 FROM (SELECT "name" as teamDesc, 
                                                          SUM(CASE WHEN "taskStatus"=''COMPLETED'' THEN 1 
                                                                             WHEN "taskStatus"=''PARTIALLY_COMPLETED'' THEN 1 
                                                                           ELSE 0 
                                                                  END)*100/count(*) as porc_completed		
                                                 FROM ${DB_SCHEMA}."Tasks" as task INNER JOIN
                                                          ${DB_SCHEMA}."Teams" as Team ON Task."TeamID"=Team."ID"
                                                 WHERE task."TenantID"='''||v1||''' '||querywhere|| '
                                                 GROUP BY "name") as ta
                                 ORDER BY porc_completed DESC
                                 LIMIT 10';	
                /*Indicator "Qty and % Completed Tasks" - Date*/	 
                EXECUTE 'INSERT INTO results (orden,type_value,name_indicator,label,value1,value2,color)
                                 SELECT 5 as orden,''CHART'' as type_value, ''chart_line'' as name_indicator,
                                                to_char("plannedDate", ''YYYY/MM/DD'') AS label, 
                                                SUM(CASE WHEN "taskStatus"=''COMPLETED'' THEN 1 
                                                                             WHEN "taskStatus"=''PARTIALLY_COMPLETED'' THEN 1 
                                                                           ELSE 0 
                                                                  END)*100/count(*) as value1,0 as value2,'''' as color
                                 FROM ${DB_SCHEMA}."Tasks" as task
                                 WHERE "TenantID"='''||v1||''' '||querywhere|| '
                                 GROUP BY to_char("plannedDate", ''YYYY/MM/DD'')
                                 ORDER BY to_char("plannedDate", ''YYYY/MM/DD'') ASC';
                /*--------------------------------------------------------------------------------------*/
        end if;
        
        if indicator_current='3' then
                /*Indicator "Qty and % Rejected Task" - Agent*/
                /*EXECUTE 'INSERT INTO results (orden,type_value,name_indicator,label,value1,value2,color)
                                 SELECT 6 as orden,''CHART'' as type_value, ''chart_bar_one'' as name_indicator,
                                             agentDesc AS label, porc_completed as value1, 0 as value2,'''' as color
                                 FROM (SELECT (Agent."firstName"||'' ''||Agent."lastName") as agentDesc, 
                                                          SUM(CASE WHEN "taskStatus"=''REJECTED'' THEN 1 
                                                                           ELSE 0 
                                                                  END)*100/count(*) as porc_completed		
                                                 FROM ${DB_SCHEMA}."Tasks" as task INNER JOIN
                                                          ${DB_SCHEMA}."Agents" as Agent ON task."AgentID"=Agent."ID"
                                                 WHERE Task."TenantID"='''||v1||''' '||querywhere|| '
                                                 GROUP BY (Agent."firstName"||'' ''||Agent."lastName")) as ta
                                 ORDER BY porc_completed DESC
                                 LIMIT 10';		*/
        
                /*Indicator "Qty and % Rejected Task" - Team*/
                EXECUTE 'INSERT INTO results (orden,type_value,name_indicator,label,value1,value2,color)
                                 SELECT 7 as orden,''CHART'' as type_value, ''chart_bar_one'' as name_indicator,
                                             teamDesc AS label, porc_completed as value1, 0 as value2,'''' as color
                                 FROM (SELECT "name" as teamDesc, 
                                                          SUM(CASE WHEN "taskStatus"=''REJECTED'' THEN 1 
                                                                           ELSE 0 
                                                                  END)*100/count(*) as porc_completed		
                                                 FROM ${DB_SCHEMA}."Tasks" as task INNER JOIN
                                                          ${DB_SCHEMA}."Teams" as Team ON task."TeamID"=Team."ID"
                                                 WHERE task."TenantID"='''||v1||''' '||querywhere|| '
                                                 GROUP BY "name") as ta
                                 ORDER BY porc_completed DESC
                                 LIMIT 10';	
                                 
                /*Indicator "Qty and % Rejected Task" - Date*/
                EXECUTE 'INSERT INTO results (orden,type_value,name_indicator,label,value1,value2,color)
                                 SELECT 8 as orden,''CHART'' as type_value, ''chart_line'' as name_indicator,
                                                to_char("plannedDate", ''YYYY/MM/DD'') AS label, 
                                                SUM(CASE WHEN "taskStatus"=''REJECTED'' THEN 1 
                                                                           ELSE 0 
                                                                  END)*100/count(*) as value1,0 as value2,'''' as color
                                 FROM ${DB_SCHEMA}."Tasks"
                                 WHERE "TenantID"='''||v1||''' '||querywhere|| '
                                 GROUP BY to_char("plannedDate", ''YYYY/MM/DD'')
                                 ORDER BY to_char("plannedDate", ''YYYY/MM/DD'') ASC';
        
                /*Indicator "Qty and % Rejected Task" - Rejected Reasons*/
                EXECUTE 'INSERT INTO results (orden,type_value,name_indicator,label,value1,value2,color)
                                 SELECT 9 as orden,''CHART'' as type_value, ''chart_pie'' as name_indicator,
                                                CASE WHEN "comment" IS NULL THEN ''NO MOTIVE''
                                                         ELSE "comment" 
                                                END AS label, count(*) as value1,0 as value2,'''' as color
                                 FROM ${DB_SCHEMA}."Tasks" as task INNER JOIN 
                                           ${DB_SCHEMA}."TaskHistories" as th ON task."ID"=th."TaskID" AND th.status=''REJECTED''
                                 WHERE "taskStatus"=''REJECTED'' AND task."TenantID"='''||v1||''' '||querywhere|| '
                                 GROUP BY "comment"
                                 ORDER BY "comment" ASC';
                /*--------------------------------------------------------------------------------------*/
        end if;
        
        if indicator_current='4' then	
                /*Indicator "Qty and % Canceled Task" - Agent*/
                /*EXECUTE 'INSERT INTO results (orden,type_value,name_indicator,label,value1,value2,color)
                                 SELECT 10 as orden,''CHART'' as type_value, ''chart_bar_one'' as name_indicator,
                                             agentDesc AS label, porc_completed as value1, 0 as value2,'''' as color
                                 FROM (SELECT (Agent."firstName"||'' ''||Agent."lastName") as agentDesc, 
                                                          SUM(CASE WHEN "taskStatus"=''CANCELLED'' THEN 1 
                                                                           ELSE 0 
                                                                  END)*100/count(*) as porc_completed		
                                                 FROM ${DB_SCHEMA}."Tasks" as task INNER JOIN
                                                          ${DB_SCHEMA}."Agents" as Agent ON task."AgentID"=Agent."ID"
                                                 WHERE Task."TenantID"='''||v1||''' '||querywhere|| '
                                                 GROUP BY (Agent."firstName"||'' ''||Agent."lastName")) as ta
                                 ORDER BY porc_completed DESC
                                 LIMIT 10';	*/
        
                /*Indicator "Qty and % Canceled Task" - Team*/
                EXECUTE 'INSERT INTO results (orden,type_value,name_indicator,label,value1,value2,color)
                                 SELECT 11 as orden,''CHART'' as type_value, ''chart_bar_one'' as name_indicator,
                                             teamDesc AS label, porc_completed as value1, 0 as value2,'''' as color
                                 FROM (SELECT "name" as teamDesc, 
                                                          SUM(CASE WHEN "taskStatus"=''CANCELLED'' THEN 1 
                                                                           ELSE 0 
                                                                  END)*100/count(*) as porc_completed		
                                                 FROM ${DB_SCHEMA}."Tasks" as task INNER JOIN
                                                          ${DB_SCHEMA}."Teams" as Team ON task."TeamID"=Team."ID"
                                                 WHERE task."TenantID"='''||v1||''' '||querywhere|| '
                                                 GROUP BY "name") as ta
                                 ORDER BY porc_completed DESC
                                 LIMIT 10';	
                                 
                /*Indicator "Qty and % Canceled Task" - Date*/
                EXECUTE 'INSERT INTO results (orden,type_value,name_indicator,label,value1,value2,color)
                                 SELECT 12 as orden,''CHART'' as type_value, ''chart_line'' as name_indicator,
                                                to_char("plannedDate", ''YYYY/MM/DD'') AS label, 
                                                SUM(CASE WHEN "taskStatus"=''CANCELLED'' THEN 1 
                                                                           ELSE 0 
                                                                  END)*100/count(*) as value1,0 as value2,'''' as color
                                 FROM ${DB_SCHEMA}."Tasks"
                                 WHERE "TenantID"='''||v1||''' '||querywhere|| '
                                 GROUP BY to_char("plannedDate", ''YYYY/MM/DD'')
                                 ORDER BY to_char("plannedDate", ''YYYY/MM/DD'') ASC';
        
                /*Indicator "Qty and % Canceled Task" - Cancellation Reasons*/
                EXECUTE 'INSERT INTO results (orden,type_value,name_indicator,label,value1,value2,color)
                                 SELECT 13 as orden,''CHART'' as type_value, ''chart_pie'' as name_indicator,
                                                CASE WHEN "comment" IS NULL THEN ''NO MOTIVE''
                                                         ELSE "comment" 
                                                END AS label, count(*) as value1,0 as value2,'''' as color
                                 FROM ${DB_SCHEMA}."Tasks" as task INNER JOIN 
                                           ${DB_SCHEMA}."TaskHistories" as th ON task."ID"=th."TaskID" AND th.status=''CANCELLED''
                                 WHERE "taskStatus"=''CANCELLED'' AND task."TenantID"='''||v1||''' '||querywhere|| '
                                 GROUP BY "comment"
                                 ORDER BY "comment" ASC';
                /*--------------------------------------------------------------------------------------*/
        end if;
        
        if indicator_current='5' then	
                /*Indicator "Average task completion time " - Team*/
                EXECUTE 'INSERT INTO results (orden,type_value,name_indicator,label,value1,value2,color)
                                 SELECT 14 as orden,''CHART'' as type_value, ''chart_bar_one'' as name_indicator,
                                             teamDesc AS label, avg_completed as value1, 0 as value2,'''' as color
                                 FROM (SELECT "name" as teamDesc, 
                                                          SUM("deliveryDate"-"plannedDate") / count(*) as avg_completed		
                                                 FROM ${DB_SCHEMA}."Tasks" as task INNER JOIN
                                                          ${DB_SCHEMA}."Teams" as Team ON task."TeamID"=Team."ID"
                                                 WHERE task."TenantID"='''||v1||''' '||querywhere|| '
                                                 GROUP BY "name") as ta
                                 ORDER BY avg_completed DESC
                                 LIMIT 10';	
                                 
                /*Indicator "Average task completion time " - Date*/
                EXECUTE 'INSERT INTO results (orden,type_value,name_indicator,label,value1,value2,color)
                                 SELECT 15 as orden,''CHART'' as type_value, ''chart_line'' as name_indicator,
                                                to_char("plannedDate", ''YYYY/MM/DD'') AS label, 
                                                SUM("deliveryDate"-"plannedDate") / count(*) as value1,0 as value2,'''' as color
                                 FROM ${DB_SCHEMA}."Tasks"
                                 WHERE "TenantID"='''||v1||''' '||querywhere|| '
                                 GROUP BY to_char("plannedDate", ''YYYY/MM/DD'')
                                 ORDER BY to_char("plannedDate", ''YYYY/MM/DD'') ASC';
                /*--------------------------------------------------------------------------------------*/
        end if;
        
        if indicator_current='6' then	
                /*Indicator "Qty and % Task executed  on time " - Agent*/
                EXECUTE 'INSERT INTO results (orden,type_value,name_indicator,label,value1,value2,color)
                                 SELECT 16 as orden,''CHART'' as type_value, ''chart_bar_one'' as name_indicator,
                                             agentDesc AS label, porc_completed as value1, 0 as value2,'''' as color
                                 FROM (SELECT (Agent."firstName"||'' ''||Agent."lastName") as agentDesc, 
                                                          SUM(CASE WHEN "deliveryDate"<="plannedDate" AND "taskStatus" IN (''COMPLETED'',''PARTIALLY_COMPLETED'') AND "deliveryDate" IS NOT NULL THEN 1 
                                                                                 ELSE 0 END) / count(*)  as porc_completed		
                                                 FROM ${DB_SCHEMA}."Tasks" as task INNER JOIN
                                                          ${DB_SCHEMA}."Agents" as Agent ON task."AgentID"=Agent."ID"
                                                 WHERE Task."TenantID"='''||v1||''' '||querywhere|| '
                                                 GROUP BY (Agent."firstName"||'' ''||Agent."lastName")) as ta
                                 ORDER BY porc_completed DESC
                                 LIMIT 10';	
                                 
                /*Indicator "Qty and % Task executed  on time " - Date*/
                EXECUTE 'INSERT INTO results (orden,type_value,name_indicator,label,value1,value2,color)
                                 SELECT 17 as orden,''CHART'' as type_value, ''chart_line'' as name_indicator,
                                                to_char("plannedDate", ''YYYY/MM/DD'') AS label, 
                                                SUM(CASE WHEN "deliveryDate"<="plannedDate" AND "taskStatus" IN (''COMPLETED'',''PARTIALLY_COMPLETED'') AND "deliveryDate" IS NOT NULL THEN 1 
                                                                                 ELSE 0 END) / count(*) as value1,0 as value2,'''' as color
                                 FROM ${DB_SCHEMA}."Tasks" as task
                                 WHERE task."TenantID"='''||v1||''' '||querywhere|| '
                                 GROUP BY to_char("plannedDate", ''YYYY/MM/DD'')
                                 ORDER BY to_char("plannedDate", ''YYYY/MM/DD'') ASC';
                /*--------------------------------------------------------------------------------------*/
        end if;
        
        if indicator_current='7' then	
                /*Indicator "Average task Acceptance time " - Team*/
                EXECUTE 'INSERT INTO results (orden,type_value,name_indicator,label,value1,value2,color)
                                 SELECT 18 as orden,''CHART'' as type_value, ''chart_pie'' as name_indicator,
                                                "name" AS label, SUM("date_accepted"-"plannedDate") / count(*) as value1,0 as value2,'''' as color
                                 FROM ${DB_SCHEMA}."Tasks" as task INNER JOIN
                                          ${DB_SCHEMA}."Teams" as Team ON task."TeamID"=Team."ID" INNER JOIN 
                                           (SELECT "TaskID", MIN(timestamp) as date_accepted
                                           FROM ${DB_SCHEMA}."TaskHistories"
                                           WHERE status=''ACCEPTED''
                                           GROUP BY "TaskID") as th ON task."ID"=th."TaskID"
                                 WHERE task."TenantID"='''||v1||''' '||querywhere|| '
                                 GROUP BY "name"
                                 ORDER BY "name" ASC';
                                 
                /*Indicator "Average task Acceptance time " - Date*/
                EXECUTE 'INSERT INTO results (orden,type_value,name_indicator,label,value1,value2,color)
                                 SELECT 19 as orden,''CHART'' as type_value, ''chart_line'' as name_indicator,
                                                to_char("plannedDate", ''YYYY/MM/DD'') AS label, 
                                                SUM("date_accepted"-"plannedDate") / count(*) as value1,0 as value2,'''' as color
                                 FROM ${DB_SCHEMA}."Tasks" as task INNER JOIN
                                           (SELECT "TaskID", MIN(timestamp) as date_accepted
                                           FROM ${DB_SCHEMA}."TaskHistories"
                                           WHERE status=''ACCEPTED''
                                           GROUP BY "TaskID") as th ON task."ID"=th."TaskID"
                                 WHERE task."TenantID"='''||v1||''' '||querywhere|| '
                                 GROUP BY to_char("plannedDate", ''YYYY/MM/DD'')
                                 ORDER BY to_char("plannedDate", ''YYYY/MM/DD'') ASC';
                  
        end if;
        
        EXECUTE 'SELECT json_agg(jsonQuery)
                         FROM (SELECT json_build_object(''orden'',orden,''type_value'',type_value,''name_indicator'',name_indicator,
                                                                                         ''label'',label,''value1'',value1,''value2'',value2,''color'',color) as jsonQuery
                                   FROM results)B'
        INTO result_json;
        
        DROP TABLE results;
        
        RETURN result_json;
        END
        $BODY$;
        
        ALTER FUNCTION ${DB_SCHEMA}.calculate_dashboard_chart(character varying, character varying)
            OWNER TO quickly;
        
        ` } );
        functions.push({name:"report_agent_list",code: ` 
        -- FUNCTION: ${DB_SCHEMA}.calculate_dashboard(character varying, character varying)

        -- DROP FUNCTION IF EXISTS ${DB_SCHEMA}.calculate_dashboard(character varying, character varying);
        
        CREATE OR REPLACE FUNCTION ${DB_SCHEMA}.report_agent_list(
                v1 character varying,
                v2 character varying)
            RETURNS json
            LANGUAGE 'plpgsql'
            COST 100
            VOLATILE PARALLEL UNSAFE
        AS $BODY$
        DECLARE
                pre_json json;
                result_json json;
                datefrom varchar(12);
                dateend varchar(12);
                agentid varchar;
                teamid varchar;
                indicator_current varchar;
                querywhere varchar;
        BEGIN
        /*Transform parameters json for filters*/
        SELECT A.param->'date-from' as datefrom,
                   A.param->'date-end' as dateend,
                   A.param->'agentid' as agentid,
                   A.param->'teamid' as teamid	   
        FROM (SELECT v2::json as param) A
        INTO datefrom,dateend,agentid,teamid;
        
        raise notice 'dateFrom: %', REPLACE(datefrom,'"','');
        raise notice 'dateEnd: %', REPLACE(dateend,'"','');
        raise notice 'agentID: %', REPLACE(agentid,'"','');
        raise notice 'teamID: %', REPLACE(teamid,'"','');
        
        teamid=REPLACE(teamid,'"','');
        querywhere='';
        /*if teamid<>'' then
           querywhere=querywhere || ' AND "TeamID"='''||teamid||'''';
        end if;
        if datefrom<>'' then
           querywhere=querywhere || ' AND "plannedDate">='''||datefrom||'''';
        end if;
        if dateend<>'' then
           querywhere=querywhere || ' AND "plannedDate"<CAST('''||dateend||''' AS DATE) + CAST(''1 days'' AS INTERVAL)';
        end if;*/
        
        
        CREATE TEMP TABLE results(orden int, field1 varchar,field2 varchar,field3 varchar,
                                                          field4 varchar, field5 varchar,field6 varchar);
        
        /*REPORT AGENT LIST*/
        EXECUTE 'INSERT INTO results (orden,field1,field2,field3,field4,field5,field6)
                         SELECT ROW_NUMBER () OVER (ORDER BY "email") as orden, "firstName", "lastName", "email", "status","homeAddress","createdAt"
                         FROM ${DB_SCHEMA}."Agents" agent
                         WHERE agent."TenantID"='''||v1||''' '||querywhere|| '
                         ORDER BY "firstName","lastName"';	
        
        EXECUTE 'SELECT json_agg(jsonQuery)
                         FROM (SELECT json_build_object(''orden'',orden,
                                                                                         ''field1'',field1,''field2'',field2,
                                                                                         ''field3'',field3,''field4'',field4,
                                                                                        ''field5'',field5,''field6'',field6) as jsonQuery
                                   FROM results
                                   ORDER BY orden)B'
        INTO result_json;
        
        DROP TABLE results;
        
        RETURN result_json;
        END
        $BODY$;
        
        ALTER FUNCTION ${DB_SCHEMA}.report_agent_list(character varying, character varying)
            OWNER TO quickly;
        
        
        ` } );
        functions.push({name:"report_tenants_list",code: `
        -- FUNCTION: ${DB_SCHEMA}.report_tenants_list(character varying, character varying)

        -- DROP FUNCTION IF EXISTS ${DB_SCHEMA}.report_tenants_list(character varying, character varying);
        
        CREATE OR REPLACE FUNCTION ${DB_SCHEMA}.report_tenants_list(
                v1 character varying,
                v2 character varying)
            RETURNS json
            LANGUAGE 'plpgsql'
            COST 100
            VOLATILE PARALLEL UNSAFE
        AS $BODY$
        DECLARE
                pre_json json;
                result_json json;
                datefrom varchar(12);
                dateend varchar(12);
                agentid varchar;
                teamid varchar;
                indicator_current varchar;
                querywhere varchar;
        BEGIN
        /*Transform parameters json for filters*/
        SELECT A.param->'date-from' as datefrom,
                   A.param->'date-end' as dateend,
                   A.param->'agentid' as agentid,
                   A.param->'teamid' as teamid	   
        FROM (SELECT v2::json as param) A
        INTO datefrom,dateend,agentid,teamid;
        
        raise notice 'dateFrom: %', REPLACE(datefrom,'"','');
        raise notice 'dateEnd: %', REPLACE(dateend,'"','');
        raise notice 'agentID: %', REPLACE(agentid,'"','');
        raise notice 'teamID: %', REPLACE(teamid,'"','');
        
        teamid=REPLACE(teamid,'"','');
        querywhere='';
        /*if teamid<>'' then
           querywhere=querywhere || ' AND "TeamID"='''||teamid||'''';
        end if;
        if datefrom<>'' then
           querywhere=querywhere || ' AND "createdAt">='''||datefrom||'''';
        end if;
        if dateend<>'' then
           querywhere=querywhere || ' AND "createdAt"<CAST('''||dateend||''' AS DATE) + CAST(''1 days'' AS INTERVAL)';
        end if;*/
        
        
        CREATE TEMP TABLE results(orden int, field1 varchar,field2 varchar,field3 varchar,
                                                          field4 varchar, field5 varchar,field6 varchar);
        
        /*REPORT AGENT LIST*/
        EXECUTE 'INSERT INTO results (orden,field1,field2,field3,field4,field5,field6)
                         SELECT ROW_NUMBER () OVER (ORDER BY "tenantAdminEmail") as orden,
                                     "tenantAdminName","tenantAdminEmail","name","status","country","address"
                         FROM ${DB_SCHEMA}."Tenants" tenant
                         WHERE 1=1 '||querywhere|| '
                         ORDER BY "tenantAdminName","name"';	
                         
        EXECUTE 'SELECT json_agg(jsonQuery)
                         FROM (SELECT json_build_object(''orden'',orden,
                                                                                         ''field1'',field1,''field2'',field2,
                                                                                         ''field3'',field3,''field4'',field4,
                                                                                        ''field5'',field5,''field6'',field6) as jsonQuery
                                   FROM results
                                   ORDER BY orden)B'
        INTO result_json;
        DROP TABLE results;
        
        RETURN result_json;
        END
        $BODY$;
        
        ALTER FUNCTION ${DB_SCHEMA}.report_tenants_list(character varying, character varying)
            OWNER TO quickly;
        
        ` } );
      
        //functions.push({name:"",code: ` ` } );
          

}

module.exports = { handler }
