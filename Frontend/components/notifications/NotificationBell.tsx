"use client";

import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { RootState, AppDispatch } from "@/app/store/store";
import {
  fetchNotifications,
  fetchUnreadCount,
  markAsRead,
  markAllAsRead,
} from "@/app/store/notificationsSlice";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  Info,
  XCircle,
  CheckCheck,
} from "lucide-react";
import type { Notification } from "@/app/store/notificationsSlice";

function getRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

function getNotificationIcon(type: Notification["type"]) {
  switch (type) {
    case "success":
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case "warning":
      return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    case "error":
      return <XCircle className="w-4 h-4 text-destructive" />;
    case "info":
      return <Info className="w-4 h-4 text-blue-500" />;
    case "task":
      return <CheckCircle className="w-4 h-4 text-primary" />;
    case "project":
      return <Info className="w-4 h-4 text-purple-500" />;
    case "system":
    default:
      return <Bell className="w-4 h-4 text-muted-foreground" />;
  }
}

export function NotificationBell() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { notifications, unreadCount } = useSelector(
    (state: RootState) => state.notifications
  );

  useEffect(() => {
    if (user) {
      dispatch(fetchNotifications({ page: 1, limit: 5 }));
      dispatch(fetchUnreadCount());
    }
  }, [user, dispatch]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      dispatch(fetchUnreadCount());
      dispatch(fetchNotifications({ page: 1, limit: 5 }));
    }, 30000);
    return () => clearInterval(interval);
  }, [user, dispatch]);

  const handleMarkAsRead = (id: string) => {
    dispatch(markAsRead(id));
  };

  const handleMarkAllAsRead = () => {
    dispatch(markAllAsRead());
  };

  const recentNotifications = notifications.slice(0, 5);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-destructive rounded-full">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h4 className="font-semibold text-sm">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto py-1 px-2 text-xs"
              onClick={handleMarkAllAsRead}
            >
              <CheckCheck className="w-3 h-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-[320px] overflow-y-auto">
          {recentNotifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            recentNotifications.map((notification) => (
              <div
                key={notification._id}
                className={`flex items-start gap-3 px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors border-b last:border-b-0 ${
                  !notification.isRead ? "bg-primary/5" : ""
                }`}
                onClick={() => {
                  if (!notification.isRead) {
                    handleMarkAsRead(notification._id);
                  }
                  if (notification.link) {
                    router.push(notification.link);
                  }
                }}
              >
                <div className="mt-0.5 shrink-0">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p
                      className={`text-sm truncate ${
                        !notification.isRead
                          ? "font-semibold"
                          : "text-muted-foreground"
                      }`}
                    >
                      {notification.title}
                    </p>
                    {!notification.isRead && (
                      <span className="w-1.5 h-1.5 bg-primary rounded-full shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {getRelativeTime(notification.createdAt)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="border-t px-4 py-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs"
            onClick={() => router.push("/notifications")}
          >
            View all notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
