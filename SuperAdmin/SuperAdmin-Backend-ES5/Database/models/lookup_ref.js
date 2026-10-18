const Sequelize = require('sequelize');
const DataTypes = require('sequelize').DataTypes;
const sequelize = require('../dbConnection.js').sequelize;
const MemberRef = require('./member_ref.js').MemberRef;

const LookupMemberRef = sequelize.define('lookup_ref', {
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
    member_type: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    price: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'lookup_ref',
    schema: 'public',
    timestamps: false,
    indexes: [
        {
            name: "lookup_ref_code_key",
            unique: true,
            fields: [
                { name: "code" },
            ]
        },
        {
            name: "lookup_ref_pkey",
            unique: true,
            fields: [
                { name: "id" },
            ]
        },
    ]
});

module.exports = {LookupMemberRef};
