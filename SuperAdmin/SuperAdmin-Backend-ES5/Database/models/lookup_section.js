const Sequelize = require('sequelize');
const DataTypes = require('sequelize').DataTypes;
const sequelize = require('../dbConnection.js').sequelize;

const LookupMemberSection = sequelize.define('lookup_Section', {
    id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
    },
    code: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    name: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    // discount: {
    //     type: DataTypes.INTEGER,
    //     allowNull: false
    // },
    // date: {
    //     type: DataTypes.DATE,
    //     allowNull: false
    // }
}, {
    tableName: 'lookup_section',
    schema: 'public',
    timestamps: false,
    indexes: [
        {
            name: "lookup_section_code_key",
            unique: true,
            fields: [
                { name: "code" },
            ]
        },
        {
            name: "lookup_section_pkey",
            unique: true,
            fields: [
                { name: "id" },
            ]
        },
    ]
});

module.exports = {LookupMemberSection};
