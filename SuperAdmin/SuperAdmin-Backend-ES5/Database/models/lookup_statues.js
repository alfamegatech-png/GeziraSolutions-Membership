const Sequelize = require('sequelize').Sequelize;
const sequelize = require('../dbConnection.js').sequelize;

const LookupStatus = sequelize.define('lookup_status', {
    id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: Sequelize.literal('nextval(\'lookup_status_id_seq\'::regclass)'),
        primaryKey: true,
    },
    code: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
    },
    name: {
        type: Sequelize.TEXT,
        allowNull: false,
    },
    tag: {
        type: Sequelize.TEXT,
        allowNull: false,
    },
}, {
    tableName: 'lookup_status',
    timestamps: false,
});

module.exports = {LookupStatus};
