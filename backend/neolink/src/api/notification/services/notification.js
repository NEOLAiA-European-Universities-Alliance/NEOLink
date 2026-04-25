'use strict';

const { createCoreService } = require('@strapi/strapi').factories;

const formatCriteriaKey = (key) => {
    const mapping = {
        category_id: 'Category',
        university: 'University',
        item_status: 'Status',
        languages: 'Language',
        erc_area: 'ERC Area',
        erc_panel: 'ERC Panel',
        erc_keyword: 'ERC Keyword',
        start_date_from: 'Start date from',
        level_of_study: 'Level of Study',
        start_date_to: 'Start date to',
        start_date_to: 'Start date to',
        end_date_from: 'End date from',
        end_date_to: 'End date to',
        expiration_from: 'Expiration from',
        expiration_to: 'Expiration to'
    };

    return mapping[key] || key.replace(/_/g, ' ');
};

const RELATION_CRITERIA_MAP = {
    category_id: { uid: 'api::item-category.item-category', field: 'name' },
    university: { uid: 'api::university.university', field: 'university_name' },
    erc_panel: { uid: 'api::erc-panel.erc-panel', field: 'name' },
    erc_keyword: { uid: 'api::erc-keyword.erc-keyword', field: 'name' },
};

const resolveHumanCriteria = async (criteria = {}) => {
    const resolved = {};
    for (const [key, value] of Object.entries(criteria)) {
        if (!value) {
            continue;
        }
        const relationConfig = RELATION_CRITERIA_MAP[key];
        if (relationConfig) {
            try {
                const entity = await strapi.documents(relationConfig.uid).findOne({
                    documentId: value,
                    fields: [relationConfig.field]
                });
                resolved[key] = entity?.[relationConfig.field] || value;
            } catch {
                resolved[key] = value;
            }
        } else {
            resolved[key] = value;
        }
    }
    return resolved;
};

const buildCriteriaSummary = (criteria = {}) => {
    return Object.entries(criteria).map(([key, value]) => {
        if (Array.isArray(value)) {
            return `${formatCriteriaKey(key)}: ${value.join(', ')}`;
        }
        return `${formatCriteriaKey(key)}: ${value}`;
    }).join(' | ');
};

const parseDate = (value) => {
    if (!value) {
        return null;
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const matchDocumentRelation = (relation, expectedDocumentId) => {
    if (!relation || !expectedDocumentId) {
        return false;
    }
    return relation.documentId === expectedDocumentId;
};

const fieldComparators = {
    category_id: (item, expected) => matchDocumentRelation(item.item_category, expected),
    university: (item, expected) => matchDocumentRelation(item.university, expected),
    erc_panel: (item, expected) => matchDocumentRelation(item.erc_panel, expected),
    erc_keyword: (item, expected) => matchDocumentRelation(item.erc_keyword, expected),
    item_status: (item, expected) => item.item_status === expected,
    level_of_study: (item, expected) => item.level_of_study === expected,
    erc_area: (item, expected) => item.erc_area === expected,
    search: (item, expected) => {
        if (!expected) {
            return true;
        }
        const term = String(expected).toLowerCase();
        const searchableFields = [
            'name',
            'description',
            'learning_outcomes',
            'speakers',
            'pedagogical_objectives',
            'level_of_study',
            'seller_name',
            'multimedial_material_provided'
        ];
        return searchableFields.some((field) => {
            const value = item[field];
            return value && String(value).toLowerCase().includes(term);
        });
    },
    languages: (item, expected) => {
        if (!item.languages || !expected) {
            return false;
        }
        return item.languages.toLowerCase().includes(String(expected).toLowerCase());
    },
    start_date_from: (item, expected) => {
        const threshold = parseDate(expected);
        const value = parseDate(item.start_date);
        if (!threshold || !value) {
            return false;
        }
        return value >= threshold;
    },
    start_date_to: (item, expected) => {
        const threshold = parseDate(expected);
        const value = parseDate(item.start_date);
        if (!threshold || !value) {
            return false;
        }
        return value <= threshold;
    },
    end_date_from: (item, expected) => {
        const threshold = parseDate(expected);
        const value = parseDate(item.end_date);
        if (!threshold || !value) {
            return false;
        }
        return value >= threshold;
    },
    end_date_to: (item, expected) => {
        const threshold = parseDate(expected);
        const value = parseDate(item.end_date);
        if (!threshold || !value) {
            return false;
        }
        return value <= threshold;
    },
    expiration_from: (item, expected) => {
        const threshold = parseDate(expected);
        const value = parseDate(item.expiration);
        if (!threshold || !value) {
            return false;
        }
        return value >= threshold;
    },
    expiration_to: (item, expected) => {
        const threshold = parseDate(expected);
        const value = parseDate(item.expiration);
        if (!threshold || !value) {
            return false;
        }
        return value <= threshold;
    }
};

module.exports = createCoreService('api::notification.notification', ({ strapi }) => ({
    matchesCriteria(item = {}, criteria = {}) {
        return Object.entries(criteria).every(([key, expected]) => {
            if (expected === undefined || expected === null || expected === '') {
                return true;
            }

            const comparator = fieldComparators[key];
            if (comparator) {
                return comparator(item, expected);
            }

            const value = item[key];
            if (value === undefined || value === null) {
                return false;
            }
            if (typeof value === 'string') {
                return value.toLowerCase() === String(expected).toLowerCase();
            }
            return value === expected;
        });
    },

    async dispatchItemCreatedNotifications(itemDocumentId) {
        if (!itemDocumentId) {
            return;
        }

        const item = await strapi.documents('api::item.item').findOne({
            documentId: itemDocumentId,
            populate: {
                item_category: true,
                university: true,
                erc_panel: true,
                erc_keyword: true
            }
        });

        if (!item) {
            return;
        }

        const subscriptions = await strapi.entityService.findMany('api::notification-subscription.notification-subscription', {
            filters: {
                is_active: true
            },
            populate: { seller: true }
        });

        for (const subscription of subscriptions) {
            if (!subscription?.seller?.documentId) {
                continue;
            }

            if (!this.matchesCriteria(item, subscription.criteria || {})) {
                continue;
            }

            await this.createNotificationForSubscription(subscription, item);
        }
    },

    async createNotificationForSubscription(subscription, item) {
        if (!subscription?.documentId || !item?.documentId) {
            return null;
        }

        const duplicates = await strapi.entityService.findMany('api::notification.notification', {
            filters: {
                subscription: {
                    documentId: subscription.documentId
                },
                item: {
                    documentId: item.documentId
                }
            },
            limit: 1
        });

        if (duplicates.length) {
            return duplicates[0];
        }

        const criteria = typeof subscription.criteria === 'string'
            ? JSON.parse(subscription.criteria)
            : subscription.criteria || {};
        const humanCriteria = await resolveHumanCriteria(criteria);
        const humanSummary = buildCriteriaSummary(humanCriteria);
        const humanAlertName = humanSummary || subscription.name || 'Custom alert';

        const now = new Date().toISOString();

        const notificationData = {
            title: item.name,
            body: `This item matches your alert: ${humanAlertName}.`,
            delivered_at: now,
            seller: {
                connect: [
                    { documentId: subscription.seller.documentId }
                ]
            },
            subscription: {
                connect: [
                    { documentId: subscription.documentId }
                ]
            },
            item: {
                connect: [
                    { documentId: item.documentId }
                ]
            }
        };

        const createdNotification = await strapi.entityService.create('api::notification.notification', {
            data: notificationData,
            populate: {
                item: true,
                subscription: true,
                seller: true
            }
        });

        await strapi.documents('api::notification-subscription.notification-subscription').update({
            documentId: subscription.documentId,
            data: {
                last_triggered_at: now
            }
        });

        if (subscription.notify_via_email && subscription.seller?.email) {
            try {
                await strapi.config.email_sender.send_notification_email({
                    to: subscription.seller.email,
                    itemName: item.name,
                    itemStatus: item.item_status,
                    itemUrl: `${process.env.FRONTEND_URL || ''}items/${item.documentId}`,
                    subscriptionName: humanAlertName,
                    criteriaSummary: humanSummary
                });

                await strapi.documents('api::notification.notification').update({
                    documentId: createdNotification.documentId,
                    data: {
                        email_sent_at: new Date().toISOString()
                    }
                });
            } catch (error) {
                strapi.log.error('Failed to send notification email', error);
            }
        }

        return createdNotification;
    },

    async dispatchInterestNotification(itemDocumentId, interestedSellerDocumentId) {
        if (!itemDocumentId || !interestedSellerDocumentId) {
            return;
        }

        const item = await strapi.documents('api::item.item').findOne({
            documentId: itemDocumentId,
            populate: {
                seller: true
            }
        });

        if (!item || !item.seller?.documentId) {
            return;
        }

        // Do not notify the seller if they are the one expressing interest
        if (item.seller.documentId === interestedSellerDocumentId) {
            return;
        }

        const interestedSeller = await strapi.documents('api::seller.seller').findOne({
            documentId: interestedSellerDocumentId,
            fields: ['full_name', 'email']
        });

        const interestedUserName = interestedSeller?.full_name || 'A user';
        const now = new Date().toISOString();

        if (item.notify_on_interest) {
            try {
                await strapi.entityService.create('api::notification.notification', {
                    data: {
                        title: item.name,
                        body: `${interestedUserName} has expressed interest in your item "${item.name}".`,
                        delivered_at: now,
                        seller: {
                            connect: [{ documentId: item.seller.documentId }]
                        },
                        item: {
                            connect: [{ documentId: itemDocumentId }]
                        }
                    }
                });
            } catch (error) {
                strapi.log.error('Failed to create interest notification', error);
            }
        }

        if (item.notify_on_interest_email && item.seller.email) {
            try {
                const itemUrl = `${process.env.FRONTEND_URL || ''}items/${itemDocumentId}`;
                await strapi.config.email_sender.send_interest_email({
                    to: item.seller.email,
                    itemName: item.name,
                    itemUrl,
                    interestedUserName
                });
            } catch (error) {
                strapi.log.error('Failed to send interest notification email', error);
            }
        }
    }
}));
