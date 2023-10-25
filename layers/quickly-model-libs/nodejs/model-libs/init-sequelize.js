const { connector } = require("./db-connector");
let sequelize = null

module.exports.initSequelize = async (event) => {
    console.log('Incoming event middleware', JSON.stringify(event))
    // connecting 
    sequelize = await connector(sequelize)
    console.log('Connection', sequelize)

    // importing models after initializing sequelize
    const Tenant = require('./tenant')(sequelize);
    const Hub = require('./hub')(sequelize);
    const Team = require('./team')(sequelize);
    const WebUser = require('./webuser')(sequelize);

    // defining relations
    // Hub belongs to a Tenant
    Hub.belongsTo(Tenant);
    // Team belongs to a Tenant and a Hub, and Hub can have many Teams
    Team.belongsTo(Tenant);
    Team.belongsTo(Hub);
    Hub.hasMany(Team);
    // Web user belongs to a Tenant and many teams
    WebUser.belongsTo(Tenant);
    WebUser.belongsToMany(Team, { through: 'WebUserTeams' });

    await sequelize.sync({ alter: true });
    console.log("All models were synchronized successfully.");
    console.log('keeping connection alive, for next use!')
    
    return {
        Hub,
        Tenant,
        Team,
        WebUser
    }
}


