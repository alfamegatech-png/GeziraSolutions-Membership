const DataTypes = require('sequelize').DataTypes;
const sequelize = require('../dbConnection.js').sequelize;

const LookupMemberQual = sequelize.define('lookup_qual', {
    id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        defaultValue: sequelize.literal("nextval('lookup_qual_id_seq'::regclass)")
    },
    code: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true
    },
    name: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    FirstMembership: {
        type: DataTypes.BOOLEAN,
        allowNull: true
    },
    renew_fee: {
        type: DataTypes.DECIMAL,
        allowNull: true
    },
    join_fee: {
        type: DataTypes.DECIMAL,
        allowNull: true
    },
    ref: {
        type: DataTypes.ARRAY(DataTypes.BIGINT),
        allowNull: true
    },
    RenewRef: {
        type: DataTypes.DECIMAL,
        allowNull: true
    },
    maintenance_fee: {
        type: DataTypes.DECIMAL,
        allowNull: true
    }
}, {
    tableName: 'lookup_qual',
    schema: 'public',
    timestamps: false,
    indexes: [
        {
            name: "lookup_qual_code_key",
            unique: true,
            fields: [
                { name: "code" },
            ]
        },
        {
            name: "lookup_qual_pkey",
            unique: true,
            fields: [
                { name: "id" },
            ]
        },
    ]
});

module.exports = {LookupMemberQual};
