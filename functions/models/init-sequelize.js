const { connector } = require("../libs/db-connector");
let sequelize = null
const { env: { SYNC = false, DB_SCHEMA }} = process


module.exports.initSequelize = async (event) => {
    console.log('Incoming event middleware', JSON.stringify(event))

    // connecting
    sequelize = await connector(sequelize)
    console.log('Connection', sequelize)

    // importing models after initializing sequelize
    const Tenant = require('./tenant')(sequelize, DB_SCHEMA);
    const Hub = require('./hub')(sequelize, DB_SCHEMA);
    const Team = require('./team')(sequelize, DB_SCHEMA);
    const WebUser = require('./webuser')(sequelize, DB_SCHEMA);
    const TenantConnection = require('./tenant-connection')(sequelize, DB_SCHEMA)
    const Agent = require('./agent')(sequelize, DB_SCHEMA)
    const Task = require('./task')(sequelize, DB_SCHEMA)
    const TaskHistory = require('./task-history')(sequelize, DB_SCHEMA)
    const TaskType = require('./task-type')(sequelize, DB_SCHEMA)
    const Message = require('./message')(sequelize, DB_SCHEMA)
    const TaskInvite = require('./task-invite')(sequelize, DB_SCHEMA)
    const Location = require('./location')(sequelize, DB_SCHEMA)
    console.log('Models imported!')

    Hub.belongsTo(Tenant);
    Team.belongsTo(Tenant);
    WebUser.belongsTo(Tenant);
    Agent.belongsTo(Tenant);
    Task.belongsTo(Tenant)

    Team.belongsTo(Hub);
    Hub.hasMany(Team);

    // Web user belongs to a Tenant and many teams
    WebUser.belongsToMany(Team, { through: 'WebUserTeams' });
    Team.belongsToMany(WebUser, { through: 'WebUserTeams' });

    //AGENTS ASSOCIATIONS
    Agent.belongsToMany(Team, { through: 'AgentTeams' });
    Team.belongsToMany(Agent, { through: 'AgentTeams' });

    // WebUser.belongsToMany(Team, { through: 'WebUserTeams' });
    TenantConnection.belongsTo(Tenant, { as: "SourceTenant", foreignKey: 'sourceTenantID' })
    TenantConnection.belongsTo(Tenant, { as: 'DestTenant', foreignKey: 'destTenantID' })
    // Team.hasMany(WebUser);

    //task model associations
    Task.belongsTo(Agent)
    Agent.hasMany(Task)

    Task.belongsTo(WebUser)
    WebUser.hasMany(Task)

    TaskHistory.belongsTo(Tenant)
    TaskHistory.belongsTo(Task)
    Task.hasMany(TaskHistory)

    TaskType.belongsTo(Tenant)
    Message.belongsTo(Tenant)
    Message.belongsTo(TaskType)
    TaskType.hasMany(Message)
    Task.belongsTo(TaskType)
    TaskType.hasMany(Task)

    TaskInvite.belongsTo(Tenant)
    TaskInvite.belongsTo(Task)
    Task.hasOne(TaskInvite)
    // Task.has
    // Task.belongsTo(Hub)
    // Hub.hasMany(Task)

    Task.belongsTo(Team)
    Team.hasMany(Task)
    // Task

    // await sequelize.sync();
    // await sequelize.sync({ alter: true });
    // if(SYNC !== false) {
    //     console.log('Syncing done!')
    // } else {
    //     console.log('Syncing skipped!')
    // }

    Location.belongsTo(Tenant)

    const enableIndividualHooks = (options) => {
        if(!options.taskHistoryDisable) {
            // Enabling individual hooks here, to avoid adding `individualHooks` on each call
            options.individualHooks = true;
        }
    }

    const createTaskHistory = async (task, options) => {
        options.individualHooks = false;
        const taskHistoryValue = {
            TenantID: event.tenantHash || event.argument.tenantID,
            TaskID: task.ID,
            status: task.taskStatus,
            changedBy: task.createdBy
        }
        
        if(options.taskHistory) {
            // history object contains [changedBy, comment, latLongs, location] fields
            Object.keys(options.taskHistory).forEach(key => taskHistoryValue[key] = options.taskHistory[key]);
        }

        await TaskHistory.create(taskHistoryValue);
    }

    Task.beforeBulkCreate(enableIndividualHooks);
    Task.afterCreate(createTaskHistory);

    Task.beforeBulkUpdate(enableIndividualHooks);
    Task.afterUpdate(createTaskHistory);
    
    console.log("All models were synchronized successfully.");
    console.log('keeping connection alive, for next use!')

    return {
        Agent,
        Hub,
        Tenant,
        Team,
        WebUser,
        TenantConnection,
        Task,
        TaskType,
        Location,
        models: sequelize.models,
        sequelize: sequelize
    }
}
