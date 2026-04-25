'use strict';

const buildSignature = (criteria = {}) => {
    const sortedKeys = Object.keys(criteria).sort();
    const normalized = {};
    sortedKeys.forEach((key) => {
        const value = criteria[key];
        normalized[key] = typeof value === 'string' ? value.trim() : value;
    });
    return JSON.stringify(normalized);
};

const sanitizeCriteria = (criteria = {}) => {
    if (typeof criteria !== 'object' || criteria === null) {
        return {};
    }

    return Object.entries(criteria).reduce((acc, [key, value]) => {
        if (value === undefined || value === null) {
            return acc;
        }

        if (typeof value === 'string' && value.trim() === '') {
            return acc;
        }

        acc[key] = value;
        return acc;
    }, {});
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

const getSellerDocumentId = (ctx) => ctx?.request?.body?.data?.user_id;

module.exports = {
    async list(ctx) {
        try {
            const sellerDocumentId = getSellerDocumentId(ctx);
            if (!sellerDocumentId) {
                return ctx.unauthorized('Missing authentication payload');
            }

            const body = ctx.request.body || {};
            const pageSize = Math.min(parseInt(body.pageSize, 10) || 20, 100);
            const page = Math.max(parseInt(body.page, 10) || 1, 1);
            const start = (page - 1) * pageSize;

            const filters = {
                seller: {
                    documentId: {
                        $eq: sellerDocumentId
                    }
                }
            };

            const subscriptions = await strapi.entityService.findMany(
                'api::notification-subscription.notification-subscription',
                {
                    filters,
                    sort: { createdAt: 'DESC' },
                    start,
                    limit: pageSize,
                    populate: {
                        notifications: {
                            sort: { createdAt: 'DESC' }
                        }
                    }
                }
            );

            const enriched = await Promise.all(
                subscriptions.map(async (sub) => {
                    try {
                        const criteria = typeof sub.criteria === 'string'
                            ? JSON.parse(sub.criteria)
                            : sub.criteria || {};
                        const criteria_resolved = await resolveHumanCriteria(criteria);
                        return { ...sub, criteria_resolved };
                    } catch {
                        return { ...sub, criteria_resolved: {} };
                    }
                })
            );

            return ctx.send({
                data: enriched,
                meta: {
                    page,
                    pageSize,
                    count: enriched.length
                }
            });
        } catch (error) {
            strapi.log.error('Failed to list notification subscriptions', error);
            return ctx.internalServerError('Unable to load subscriptions right now');
        }
    },

    async create(ctx) {
        try {
            const sellerDocumentId = getSellerDocumentId(ctx);
            if (!sellerDocumentId) {
                return ctx.unauthorized('Missing authentication payload');
            }

            const body = ctx.request.body || {};
            const { name, description, criteria, notify_via_email = true } = body;
            if (!name || !name.trim()) {
                return ctx.badRequest('A friendly name is required for your alert');
            }

            const sanitizedCriteria = sanitizeCriteria(criteria);
            if (Object.keys(sanitizedCriteria).length === 0) {
                return ctx.badRequest('You need to select at least one filter to watch');
            }

            const signature = buildSignature(sanitizedCriteria);
            const duplicates = await strapi.entityService.findMany(
                'api::notification-subscription.notification-subscription',
                {
                    filters: {
                        seller: {
                            documentId: {
                                $eq: sellerDocumentId
                            }
                        },
                        criteria_signature: signature
                    },
                    limit: 1
                }
            );

            if (duplicates.length) {
                return ctx.badRequest('This alert already exists for your account');
            }

            const createdSubscription = await strapi.entityService.create(
                'api::notification-subscription.notification-subscription',
                {
                    data: {
                        name: name.trim(),
                        description: description || null,
                        criteria: sanitizedCriteria,
                        criteria_signature: signature,
                        notify_via_email: Boolean(notify_via_email),
                        seller: {
                            connect: [
                                { documentId: sellerDocumentId }
                            ]
                        }
                    },
                    populate: { notifications: true }
                }
            );

            return ctx.send({ data: createdSubscription });
        } catch (error) {
            strapi.log.error('Failed to create notification subscription', error);
            return ctx.internalServerError('Unable to create subscription right now');
        }
    },

    async update(ctx) {
        try {
            const sellerDocumentId = getSellerDocumentId(ctx);
            if (!sellerDocumentId) {
                return ctx.unauthorized('Missing authentication payload');
            }

            const body = ctx.request.body || {};
            const { subscriptionId, name, description, criteria, notify_via_email, is_active } = body;
            if (!subscriptionId) {
                return ctx.badRequest('Missing subscription identifier');
            }

            const existingSubscription = await strapi.documents('api::notification-subscription.notification-subscription').findOne({
                documentId: subscriptionId,
                populate: { seller: true }
            });

            if (!existingSubscription) {
                return ctx.notFound('Subscription not found');
            }

            if (existingSubscription.seller?.documentId !== sellerDocumentId) {
                return ctx.forbidden('You cannot modify this subscription');
            }

            const data = {};
            if (typeof name === 'string') {
                data.name = name.trim();
            }
            if (typeof description === 'string' || description === null) {
                data.description = description;
            }
            if (typeof notify_via_email === 'boolean') {
                data.notify_via_email = notify_via_email;
            }
            if (typeof is_active === 'boolean') {
                data.is_active = is_active;
            }
            if (criteria) {
                const sanitizedCriteria = sanitizeCriteria(criteria);
                if (Object.keys(sanitizedCriteria).length === 0) {
                    return ctx.badRequest('Subscriptions need at least one active filter');
                }
                data.criteria = sanitizedCriteria;
                data.criteria_signature = buildSignature(sanitizedCriteria);
            }

            const updatedSubscription = await strapi.documents('api::notification-subscription.notification-subscription').update({
                documentId: subscriptionId,
                data,
                populate: { notifications: true }
            });

            return ctx.send({ data: updatedSubscription });
        } catch (error) {
            strapi.log.error('Failed to update notification subscription', error);
            return ctx.internalServerError('Unable to update subscription right now');
        }
    },

    async delete(ctx) {
        try {
            const sellerDocumentId = getSellerDocumentId(ctx);
            if (!sellerDocumentId) {
                return ctx.unauthorized('Missing authentication payload');
            }

            const body = ctx.request.body || {};
            const { subscriptionId } = body;
            if (!subscriptionId) {
                return ctx.badRequest('Missing subscription identifier');
            }

            const existingSubscription = await strapi.documents('api::notification-subscription.notification-subscription').findOne({
                documentId: subscriptionId,
                populate: { seller: true }
            });

            if (!existingSubscription) {
                return ctx.notFound('Subscription not found');
            }

            if (existingSubscription.seller?.documentId !== sellerDocumentId) {
                return ctx.forbidden('You cannot delete this subscription');
            }

            await strapi.documents('api::notification-subscription.notification-subscription').delete({
                documentId: subscriptionId
            });

            return ctx.send({ success: true });
        } catch (error) {
            strapi.log.error('Failed to delete notification subscription', error);
            return ctx.internalServerError('Unable to delete subscription right now');
        }
    }
};
