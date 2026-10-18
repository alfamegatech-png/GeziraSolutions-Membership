const Sequelize = require('sequelize');
const sequelize = require('../../Database/dbConnection.js').sequelize;
const Member = require('./members.js').Member;
const LookupMemberType = require('./lookup_Member_Type.js').LookupMemberType;
const LookupMemberSection = require('./lookup_section.js').LookupMemberSection;
const LookupMemberJob = require('./lookup_job.js').LookupMemberJob;
const LookupMemberQual = require('./lookup_qual.js').LookupMemberQual;
const LookupMemberRef = require('./lookup_ref.js').LookupMemberRef;

const MemberRef = sequelize.define('members_ref', {
    id: {
        type: Sequelize.TEXT,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.fn('gen_random_uuid'),
    },
    birth_date: {
        type: Sequelize.DATEONLY,
    },
    member_type: {
        type: Sequelize.INTEGER,
    },
    member_code: {
        type: Sequelize.INTEGER,
        references: {
            model: 'members',
            key: 'member_code',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
    },
    name: {
        type: Sequelize.TEXT,
    },
    ref: {
        type: Sequelize.INTEGER,
        references: {
            model: 'lookup_ref',
            key: 'code',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
    },
    serial_no: {
        type: Sequelize.INTEGER,
    },
    sex: {
        type: Sequelize.INTEGER,
        references: {
            model: 'lookup_sex',
            key: 'code',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
    },
    image_name: {
        type: Sequelize.TEXT,
    },
    username: {
        type: Sequelize.TEXT,
    },
    join_date: {
        type: Sequelize.DATEONLY,
    },
    user_id: {
        type: Sequelize.TEXT,
        references: {
            model: 'users',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
    },
    deleted: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    remark: {
        type: Sequelize.TEXT,
    },
    suspended: {
        type: Sequelize.TEXT,
    }
}, {
    tableName: 'members_ref',
    timestamps: false,
});

Member.hasMany(MemberRef, { foreignKey: 'member_code', sourceKey: 'member_code', as: 'member_ref' });
MemberRef.belongsTo(Member, { foreignKey: 'member_code', targetKey: 'member_code', as: 'member_ref' });

Member.belongsTo(LookupMemberType, {
    foreignKey: 'member_type',
    targetKey: 'code',
    as: 'memberType'
});
Member.belongsTo(LookupMemberSection, {
    foreignKey: 'section',
    targetKey: 'code',
    as: 'memberSection'
});
Member.belongsTo(LookupMemberJob, {
    foreignKey: 'job',
    targetKey: 'code',
    as: 'memberJob'
});
Member.belongsTo(LookupMemberQual, {
    foreignKey: 'qual',
    targetKey: 'code',
    as: 'memberQual'
});
MemberRef.belongsTo(LookupMemberRef, {
    foreignKey: 'ref',
    targetKey: 'code',
    as: 'lookup_ref'
});

module.exports = {MemberRef};
