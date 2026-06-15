import { useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getFanNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  requestBrowserNotificationPermission,
  showBrowserNotification,
  subscribeToNotificationUpdates,
} from "../../lib/notificationStorage";

export default function FanNotificationBell() {
  const navigate = useNavigate();
  const menuId = useId();
  const panelRef = useRef(null);
  const buttonRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(getFanNotifications);
  const unreadCount = notifications.filter((item) => !item.read).length;
  const lastBrowserNotifyId = useRef(null);

  const refresh = () => setNotifications(getFanNotifications());

  useEffect(() => subscribeToNotificationUpdates(refresh), []);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (
        panelRef.current?.contains(event.target) ||
        buttonRef.current?.contains(event.target)
      ) {
        return;
      }
      setOpen(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    const latestUnread = notifications.find((item) => !item.read);
    if (!latestUnread || window.Notification?.permission !== "granted") return;
    if (lastBrowserNotifyId.current === latestUnread.id) return;
    lastBrowserNotifyId.current = latestUnread.id;
    showBrowserNotification(latestUnread);
  }, [notifications]);

  const handleOpenNotification = (notification) => {
    markNotificationRead(notification.id);
    refresh();
    setOpen(false);
    navigate(`/feed?dropId=${encodeURIComponent(notification.dropId)}`);
  };

  const handleEnableBrowserAlerts = async () => {
    const permission = await requestBrowserNotificationPermission();
    if (permission === "granted") {
      const latest = getFanNotifications()[0];
      if (latest) showBrowserNotification(latest);
    }
  };

  return (
    <div className="notification-bell-wrap">
      <button
        ref={buttonRef}
        type="button"
        className="notification-bell-button"
        aria-label={
          unreadCount > 0
            ? `${unreadCount} unread content drop notification${unreadCount === 1 ? "" : "s"}`
            : "Content drop notifications"
        }
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="notification-bell-icon" aria-hidden="true">🔔</span>
        {unreadCount > 0 && (
          <span className="notification-bell-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
        )}
      </button>

      {unreadCount > 0 && !open && (
        <span className="notification-new-pill" aria-hidden="true">New Drop</span>
      )}

      {open && (
        <div ref={panelRef} id={menuId} className="notification-panel" role="region" aria-label="Notifications">
          <div className="notification-panel-header">
            <div>
              <div className="notification-panel-title">Drop alerts</div>
              <div className="notification-panel-meta">
                {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
              </div>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                className="notification-mark-all"
                onClick={() => {
                  markAllNotificationsRead();
                  refresh();
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="notification-empty">No drop alerts yet.</div>
          ) : (
            <ul className="notification-list">
              {notifications.map((notification) => (
                <li key={notification.id}>
                  <button
                    type="button"
                    className={
                      notification.read ? "notification-item is-read" : "notification-item"
                    }
                    onClick={() => handleOpenNotification(notification)}
                  >
                    <span className="notification-item-title">{notification.title}</span>
                    <span className="notification-item-message">{notification.message}</span>
                    <span className="notification-item-time">
                      {new Date(notification.createdAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {typeof window !== "undefined" && "Notification" in window && (
            <div className="notification-panel-footer">
              <button
                type="button"
                className="notification-enable-alerts"
                onClick={handleEnableBrowserAlerts}
              >
                Enable browser alerts
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
