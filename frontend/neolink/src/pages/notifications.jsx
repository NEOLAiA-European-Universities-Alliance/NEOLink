import { useContext, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/navbar";
import { AuthContext } from "../components/AuthContext.jsx";
import { notificationsApi } from "../services/notifications";
import { base_url } from "../api";

const TAB_IDS = {
    NOTIFICATIONS: 'notifications',
    ALERTS: 'alerts'
};

const tabs = [
    { id: TAB_IDS.NOTIFICATIONS, label: 'Notifications', emoji: '📢' },
    { id: TAB_IDS.ALERTS, label: 'Saved alerts', emoji: '🔔' }
];

const NOTIFICATIONS_UPDATED_EVENT = 'neolink-notifications-updated';

const broadcastNotificationsUpdate = () => {
    if (typeof window === 'undefined') {
        return;
    }
    window.dispatchEvent(new Event(NOTIFICATIONS_UPDATED_EVENT));
};

const CRITERIA_LABELS = {
    category_id: 'Category',
    university: 'University',
    item_status: 'Status',
    languages: 'Language',
    erc_area: 'ERC Area',
    erc_panel: 'ERC Panel',
    erc_keyword: 'ERC Keyword',
    search: 'Search',
    start_date_from: 'Start from',
    start_date_to: 'Start to',
    end_date_from: 'End from',
    end_date_to: 'End to',
    expiration_from: 'Expiration from',
    expiration_to: 'Expiration to',
};

const ERC_AREA_LABELS = {
    'Life Sciences (LS)': 'Life Sciences (LS)',
    'Physical Sciences and Engineering (PE)': 'Physical Sciences and Engineering (PE)',
    'Social Sciences and Humanities (SH)': 'Social Sciences and Humanities (SH)',
    LS: 'Life Sciences (LS)',
    PE: 'Physical Sciences and Engineering (PE)',
    SH: 'Social Sciences and Humanities (SH)'
};

const toDisplayText = (value) => {
    if (value === null || value === undefined) {
        return '';
    }
    if (typeof value === 'object') {
        return value.name || value.university_name || value.label || value.attributes?.name || value.attributes?.university_name || value.documentId || value.id || '';
    }
    return String(value);
};

const formatCriteria = (criteria = {}, resolveValue = (_, value) => value) => {
    const entries = Object.entries(criteria).filter(([, value]) => Boolean(value));
    if (entries.length === 0) {
        return ['Any new item'];
    }
    return entries.map(([key, value]) => {
        const label = CRITERIA_LABELS[key] || key.replace(/_/g, ' ');
        return `${label}: ${toDisplayText(resolveValue(key, value))}`;
    });
};

const expandLanguageChips = (chips = []) => {
    return chips.flatMap((chip) => {
        if (typeof chip !== 'string') {
            return [];
        }

        const [label, rawValue] = chip.split(':');
        if (!label || !rawValue) {
            return [chip];
        }

        if (label.trim().toLowerCase() !== 'language') {
            return [chip];
        }

        const languages = rawValue
            .split(',')
            .map((entry) => entry.trim())
            .filter(Boolean);

        if (languages.length === 0) {
            return [chip];
        }

        return languages.map((language) => `${label.trim()}: ${language}`);
    });
};

function NotificationsPage() {
    const navigate = useNavigate();
    const { token, loading } = useContext(AuthContext);

    const [activeTab, setActiveTab] = useState(TAB_IDS.NOTIFICATIONS);

    const [notifications, setNotifications] = useState([]);
    const [notificationsLoading, setNotificationsLoading] = useState(true);
    const [notificationsError, setNotificationsError] = useState(null);

    const [subscriptions, setSubscriptions] = useState([]);
    const [subscriptionsLoading, setSubscriptionsLoading] = useState(true);
    const [subscriptionsError, setSubscriptionsError] = useState(null);
    const [subscriptionPendingId, setSubscriptionPendingId] = useState(null);
    const [universitiesById, setUniversitiesById] = useState({});
    const [ercPanelsById, setErcPanelsById] = useState({});
    const [ercKeywordsById, setErcKeywordsById] = useState({});

    const [onlyUnread, setOnlyUnread] = useState(false);
    const [markingAll, setMarkingAll] = useState(false);

    useEffect(() => {
        if (!loading && !token) {
            navigate('/login');
        }
    }, [token, loading, navigate]);

    const fetchNotifications = useCallback(async () => {
        if (!token) {
            return;
        }
        setNotificationsLoading(true);
        setNotificationsError(null);
        try {
            const response = await notificationsApi.listNotifications(token, { onlyUnread });
            setNotifications(response.data || []);
        } catch (err) {
            setNotificationsError('Unable to load notifications right now.');
        } finally {
            setNotificationsLoading(false);
        }
    }, [token, onlyUnread]);

    const fetchSubscriptions = useCallback(async () => {
        if (!token) {
            return;
        }
        setSubscriptionsLoading(true);
        setSubscriptionsError(null);
        try {
            const response = await notificationsApi.listSubscriptions(token, { page: 1, pageSize: 50 });
            setSubscriptions(response.data || []);
        } catch (err) {
            setSubscriptionsError('Unable to load your alerts.');
        } finally {
            setSubscriptionsLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (!token) {
            return;
        }

        if (activeTab === TAB_IDS.NOTIFICATIONS) {
            fetchNotifications();
        } else {
            fetchSubscriptions();
        }
    }, [token, activeTab, fetchNotifications, fetchSubscriptions]);

    useEffect(() => {
        if (!token) {
            return;
        }

        const extractList = (payload) => {
            if (Array.isArray(payload)) {
                return payload;
            }
            if (Array.isArray(payload?.data)) {
                return payload.data;
            }
            return [];
        };

        const toIdNameMap = (entities) => {
            const nextMap = {};
            entities.forEach((entity) => {
                const id = entity.documentId || entity.id || entity.attributes?.documentId;
                const name = entity.attributes?.name || entity.name;
                if (id && name) {
                    nextMap[id] = name;
                }
            });
            return nextMap;
        };

        const loadCriteriaDictionaries = async () => {
            try {
                const [universitiesResponse, panelsResponse, keywordsResponse] = await Promise.all([
                    axios.get(`${base_url}/universities`),
                    axios.get(`${base_url}/erc-panels?pagination[pageSize]=500`),
                    axios.get(`${base_url}/erc-keywords?pagination[pageSize]=1000`)
                ]);

                const universities = extractList(universitiesResponse.data);
                const panels = extractList(panelsResponse.data);
                const keywords = extractList(keywordsResponse.data);

                const universitiesMap = {};
                universities.forEach((uni) => {
                    const id = uni.documentId || uni.id;
                    const name = uni.attributes?.name || uni.university_name || uni.name;
                    if (id && name) {
                        universitiesMap[id] = name;
                    }
                });

                setUniversitiesById(universitiesMap);
                setErcPanelsById(toIdNameMap(panels));
                setErcKeywordsById(toIdNameMap(keywords));
            } catch (err) {
                setUniversitiesById({});
                setErcPanelsById({});
                setErcKeywordsById({});
            }
        };

        loadCriteriaDictionaries();
    }, [token]);

    const handleMarkRead = async (notificationId) => {
        try {
            await notificationsApi.markNotificationRead(token, { notificationId, is_read: true });
            await fetchNotifications();
            broadcastNotificationsUpdate();
        } catch (err) {
            setNotificationsError('Failed to update the notification.');
        }
    };

    const handleMarkAll = async () => {
        setMarkingAll(true);
        try {
            await notificationsApi.markAllNotificationsRead(token);
            await fetchNotifications();
            broadcastNotificationsUpdate();
        } catch (err) {
            setNotificationsError('Unable to mark all notifications as read.');
        } finally {
            setMarkingAll(false);
        }
    };

    const handleViewItem = async (notification) => {
        const itemDocumentId = notification.item?.documentId;
        if (!itemDocumentId) {
            return;
        }

        if (token && !notification.is_read) {
            try {
                await notificationsApi.markNotificationRead(token, { notificationId: notification.documentId, is_read: true });
                setNotifications((prev) => prev.map((item) => (
                    item.documentId === notification.documentId ? { ...item, is_read: true } : item
                )));
                broadcastNotificationsUpdate();
            } catch (err) {
                setNotificationsError('Failed to update the notification.');
            }
        }

        navigate(`/items/${itemDocumentId}`);
    };

    const updateSubscription = async (subscriptionId, data) => {
        setSubscriptionPendingId(subscriptionId);
        try {
            await notificationsApi.updateSubscription(token, { subscriptionId, ...data });
            fetchSubscriptions();
        } catch (err) {
            setSubscriptionsError('Unable to update the alert.');
        } finally {
            setSubscriptionPendingId(null);
        }
    };

    const handleDeleteSubscription = async (subscriptionId) => {
        const confirmed = window.confirm('Remove this alert?');
        if (!confirmed) {
            return;
        }
        setSubscriptionPendingId(subscriptionId);
        try {
            await notificationsApi.deleteSubscription(token, { subscriptionId });
            fetchSubscriptions();
        } catch (err) {
            setSubscriptionsError('Failed to delete the alert.');
        } finally {
            setSubscriptionPendingId(null);
        }
    };

    const renderNotificationCard = (notification) => {
        const subscriptionName = notification.subscription?.name || 'Custom alert';
        const itemName = notification.item?.name || notification.title || 'Item';
        const isUnread = !notification.is_read;
        const isItemDeleted = !notification.item;
        const notificationCriteria = notification.subscription?.criteria || {};
        const resolvedCriteriaChips = expandLanguageChips(formatCriteria(
            notificationCriteria,
            (key, value) => {
                if (key === 'university') {
                    return universitiesById[value] || value;
                }
                if (key === 'erc_area') {
                    return ERC_AREA_LABELS[value] || value;
                }
                if (key === 'erc_panel') {
                    return ercPanelsById[value] || value;
                }
                if (key === 'erc_keyword') {
                    return ercKeywordsById[value] || value;
                }
                return value;
            }
        ));
        const notificationBody = resolvedCriteriaChips.length > 0
            ? `This item matches your alert: ${resolvedCriteriaChips.join(' | ')}.`
            : notification.body;

        return (
            <div
                key={notification.documentId}
                style={{
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    border: `1px solid ${isUnread ? '#d4d0f0' : '#e8eef3'}`,
                    boxShadow: isUnread ? '0 4px 20px rgba(124, 111, 214, 0.12)' : '0 4px 20px rgba(0, 0, 0, 0.06)',
                    transition: 'all 0.2s ease',
                    textAlign: 'left',
                    opacity: isItemDeleted ? 0.7 : 1
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{ flex: '1 1 0', minWidth: 0 }}>
                        <h4 style={{ margin: 0, color: '#1a2f44', fontWeight: 700, textAlign: 'left' }}>{itemName}</h4>
                        <p style={{ margin: '0.3rem 0 0', fontSize: '0.8rem', color: '#8899a8', fontWeight: 500, textAlign: 'left' }}>{subscriptionName}</p>
                    </div>
                    <span style={{
                        padding: '0.3rem 0.85rem',
                        borderRadius: '999px',
                        backgroundColor: isUnread ? '#f0f0ff' : '#f1f3f5',
                        color: isUnread ? '#7c6fd6' : '#8899a8',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        marginTop: '0.15rem'
                    }}>
                        {isUnread ? 'Unread' : 'Read'}
                    </span>
                </div>

                <p style={{ marginTop: '0.75rem', marginBottom: '0.75rem', color: '#495057', lineHeight: '1.6', fontSize: '0.95rem', textAlign: 'left' }}>{notificationBody}</p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem', justifyContent: 'flex-start' }}>
                    <span style={{
                        backgroundColor: isItemDeleted ? '#fff5f5' : '#f8f9fa',
                        borderRadius: '999px',
                        padding: '0.3rem 0.85rem',
                        fontSize: '0.85rem',
                        color: isItemDeleted ? '#c92a2a' : '#495057',
                        fontWeight: isItemDeleted ? 600 : 400
                    }}>
                        Status: {notification.item?.item_status || 'deleted'}
                    </span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'flex-start' }}>
                    <button
                        onClick={() => !isItemDeleted && handleViewItem(notification)}
                        disabled={isItemDeleted}
                        style={{
                            padding: '0.6rem 1.25rem',
                            borderRadius: '10px',
                            border: 'none',
                            background: isItemDeleted ? '#e9ecef' : 'linear-gradient(135deg, #7c6fd6 0%, #8b7ad6 100%)',
                            color: isItemDeleted ? '#8899a8' : 'white',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            cursor: isItemDeleted ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: isItemDeleted ? 'none' : '0 2px 8px rgba(124, 111, 214, 0.25)',
                            opacity: isItemDeleted ? 0.6 : 1
                        }}
                        title={isItemDeleted ? 'This item has been deleted from the platform' : 'View item'}
                    >
                        {isItemDeleted ? 'Event deleted' : 'View'}
                    </button>
                    {isUnread && (
                        <button
                            onClick={() => handleMarkRead(notification.documentId)}
                            style={{
                                padding: '0.6rem 1rem',
                                borderRadius: '10px',
                                border: '1px solid #e8eef3',
                                backgroundColor: 'white',
                                color: '#495057',
                                fontWeight: 600,
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            Mark as read
                        </button>
                    )}
                </div>
            </div>
        );
    };

    const renderSubscriptionCard = (subscription) => {
        const chips = formatCriteria(
            subscription.criteria_resolved || subscription.criteria || {},
            (key, value) => {
                if (key === 'university') {
                    return universitiesById[value] || value;
                }
                if (key === 'erc_area') {
                    return ERC_AREA_LABELS[value] || value;
                }
                if (key === 'erc_panel') {
                    return ercPanelsById[value] || value;
                }
                if (key === 'erc_keyword') {
                    return ercKeywordsById[value] || value;
                }
                return value;
            }
        );
        const chipsExpanded = expandLanguageChips(chips);
        const isPaused = !subscription.is_active;
        const isPending = subscriptionPendingId === subscription.documentId;

        return (
            <div
                key={subscription.documentId}
                style={{
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    border: '1px solid #e8eef3',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
                    transition: 'all 0.2s ease',
                    textAlign: 'left'
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{ flex: '1 1 0', minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#8899a8', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left' }}>Saved alert</p>
                        <h4 style={{ margin: '0.25rem 0 0', color: '#1a2f44', fontWeight: 700, textAlign: 'left' }}>{subscription.name}</h4>
                    </div>
                    <span style={{
                        padding: '0.3rem 0.85rem',
                        borderRadius: '999px',
                        backgroundColor: isPaused ? '#fff3bf' : '#e6fcf5',
                        color: isPaused ? '#ad7f00' : '#2b8a3e',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        marginTop: '0.15rem'
                    }}>
                        {isPaused ? 'Paused' : 'Live'}
                    </span>
                </div>

                <p style={{ marginTop: '0.75rem', color: '#8899a8', fontSize: '0.85rem', textAlign: 'left' }}>
                    Last match: {subscription.last_triggered_at ? new Date(subscription.last_triggered_at).toLocaleString() : 'Not triggered yet'}
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', margin: '1rem 0' }}>
                    {chipsExpanded.map((chip, index) => (
                        <span
                            key={`${chip}-${index}`}
                            style={{
                                backgroundColor: '#f0f0ff',
                                borderRadius: '999px',
                                padding: '0.3rem 0.85rem',
                                color: '#5a4fb9',
                                fontSize: '0.85rem'
                            }}
                        >
                            {chip}
                        </span>
                    ))}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <button
                        onClick={() => updateSubscription(subscription.documentId, { is_active: !subscription.is_active })}
                        disabled={isPending}
                        style={{
                            padding: '0.5rem 1.25rem',
                            borderRadius: '10px',
                            border: '1px solid #e8eef3',
                            backgroundColor: 'white',
                            color: '#495057',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            cursor: isPending ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        {isPaused ? 'Resume alert' : 'Pause alert'}
                    </button>
                    <button
                        onClick={() => updateSubscription(subscription.documentId, { notify_via_email: !subscription.notify_via_email })}
                        disabled={isPending}
                        style={{
                            padding: '0.5rem 1.25rem',
                            borderRadius: '10px',
                            border: '1px solid #e8eef3',
                            backgroundColor: subscription.notify_via_email ? '#f0f0ff' : 'white',
                            color: subscription.notify_via_email ? '#7c6fd6' : '#495057',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            cursor: isPending ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        {subscription.notify_via_email ? 'Email enabled' : 'Email disabled'}
                    </button>
                    <button
                        onClick={() => handleDeleteSubscription(subscription.documentId)}
                        disabled={isPending}
                        style={{
                            padding: '0.5rem 1.25rem',
                            borderRadius: '10px',
                            border: 'none',
                            backgroundColor: '#ffe3e3',
                            color: '#c92a2a',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            cursor: isPending ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        Delete
                    </button>
                </div>
            </div>
        );
    };

    const isNotificationsTab = activeTab === TAB_IDS.NOTIFICATIONS;
    const currentError = isNotificationsTab ? notificationsError : subscriptionsError;
    const isLoading = isNotificationsTab ? notificationsLoading : subscriptionsLoading;

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f4f7fa' }}>
            <Navbar token={token} />
            <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem 3rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem', alignItems: 'flex-start' }}>
                    <div>
                        <p style={{ color: '#7c6fd6', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.4rem' }}>Notification hub</p>
                        <h2 style={{ margin: 0, color: '#1a2f44', fontSize: '1.5rem', fontWeight: 700 }}>Stay on top of new events</h2>
                        <p style={{ color: '#6b7c8a', marginTop: '0.5rem', fontSize: '0.95rem' }}>
                            Switch between real-time notifications and the alert criteria that power them.
                        </p>
                    </div>
                    {isNotificationsTab ? (
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#fff', borderRadius: '999px', padding: '0.4rem 0.85rem', border: '1px solid #e8eef3', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, color: '#495057' }}>
                                <input
                                    type="checkbox"
                                    checked={onlyUnread}
                                    onChange={(e) => setOnlyUnread(e.target.checked)}
                                />
                                Only unread
                            </label>
                            <button
                                onClick={handleMarkAll}
                                disabled={markingAll}
                                style={{
                                    padding: '0.55rem 1.1rem',
                                    borderRadius: '10px',
                                    border: 'none',
                                    background: markingAll ? '#cfd2f1' : 'linear-gradient(135deg, #7c6fd6 0%, #8b7ad6 100%)',
                                    color: 'white',
                                    fontWeight: 600,
                                    fontSize: '0.85rem',
                                    cursor: markingAll ? 'not-allowed' : 'pointer',
                                    boxShadow: '0 2px 8px rgba(124, 111, 214, 0.25)',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {markingAll ? 'Updating…' : 'Mark all as read'}
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => navigate('/items')}
                            style={{
                                padding: '0.55rem 1.1rem',
                                borderRadius: '10px',
                                border: 'none',
                                background: 'linear-gradient(135deg, #7c6fd6 0%, #8b7ad6 100%)',
                                color: 'white',
                                fontWeight: 600,
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                boxShadow: '0 2px 8px rgba(124, 111, 214, 0.25)',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            Browse items
                        </button>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                    {tabs.map((tab) => {
                        const isActive = tab.id === activeTab;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.65rem 1.25rem',
                                    borderRadius: '999px',
                                    border: isActive ? 'none' : '1px solid #e8eef3',
                                    backgroundColor: isActive ? '#f0f0ff' : 'white',
                                    color: isActive ? '#7c6fd6' : '#495057',
                                    fontWeight: 600,
                                    cursor: isActive ? 'default' : 'pointer',
                                    boxShadow: isActive ? '0 4px 12px rgba(124, 111, 214, 0.2)' : '0 2px 6px rgba(0, 0, 0, 0.04)',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <span>{tab.emoji}</span>
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {currentError && (
                    <div style={{
                        marginBottom: '1rem',
                        padding: '1rem 1.25rem',
                        borderRadius: '12px',
                        border: '1px solid #ffc9c9',
                        backgroundColor: '#fff5f5',
                        color: '#c92a2a',
                        fontSize: '0.9rem'
                    }}>
                        {currentError}
                    </div>
                )}

                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                        <div style={{
                            width: '3rem',
                            height: '3rem',
                            border: '4px solid #e8eef3',
                            borderTop: '4px solid #7c6fd6',
                            borderRadius: '50%',
                            margin: '0 auto',
                            animation: 'spin 1s linear infinite'
                        }}></div>
                        <p style={{ marginTop: '1rem', color: '#8899a8' }}>Loading {isNotificationsTab ? 'notifications' : 'alerts'}…</p>
                    </div>
                ) : isNotificationsTab ? (
                    notifications.length === 0 ? (
                        <div style={{
                            padding: '4rem 2rem',
                            textAlign: 'center',
                            backgroundColor: 'white',
                            borderRadius: '16px',
                            border: '1px dashed #e8eef3',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)'
                        }}>
                            <div style={{ fontSize: '3rem' }}>✨</div>
                            <h3 style={{ color: '#1a2f44', fontWeight: 700 }}>Nothing to review</h3>
                            <p style={{ color: '#6b7c8a' }}>
                                {onlyUnread ? 'You have read all notifications.' : 'Create a subscription from the items page to start receiving updates.'}
                            </p>
                            <button
                                onClick={() => navigate('/items')}
                                style={{
                                    marginTop: '1rem',
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '10px',
                                    border: 'none',
                                    background: 'linear-gradient(135deg, #7c6fd6 0%, #8b7ad6 100%)',
                                    color: 'white',
                                    fontWeight: 600,
                                    fontSize: '0.9rem',
                                    cursor: 'pointer',
                                    boxShadow: '0 2px 8px rgba(124, 111, 214, 0.25)',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                Go to items
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {notifications.map(renderNotificationCard)}
                        </div>
                    )
                ) : (
                    subscriptions.length === 0 ? (
                        <div style={{
                            padding: '4rem 2rem',
                            textAlign: 'center',
                            backgroundColor: 'white',
                            borderRadius: '16px',
                            border: '1px dashed #e8eef3',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)'
                        }}>
                            <div style={{ fontSize: '3rem' }}>🔔</div>
                            <h3 style={{ color: '#1a2f44', fontWeight: 700 }}>No alerts yet</h3>
                            <p style={{ color: '#6b7c8a' }}>
                                Filter the items list and click "Notify me" to start tracking new entries automatically.
                            </p>
                            <button
                                onClick={() => navigate('/items')}
                                style={{
                                    marginTop: '1rem',
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '10px',
                                    border: 'none',
                                    background: 'linear-gradient(135deg, #7c6fd6 0%, #8b7ad6 100%)',
                                    color: 'white',
                                    fontWeight: 600,
                                    fontSize: '0.9rem',
                                    cursor: 'pointer',
                                    boxShadow: '0 2px 8px rgba(124, 111, 214, 0.25)',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                Browse items
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {subscriptions.map(renderSubscriptionCard)}
                        </div>
                    )
                )}
            </div>

            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

export default NotificationsPage;
