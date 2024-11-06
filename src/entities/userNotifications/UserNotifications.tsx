import React, { useEffect, useRef, useState } from 'react';

import Outlinebell from '@/../public/assets/components/Outlinebell';
import { useGetNotificationsQuery } from '@/shared/api/notifications/notificationsAPI';
import { INotificationItem } from '@/shared/api/notifications/notificationsTypes';
import { useSocket } from '@/shared/lib/hooks/useSocket';
import { Button, CustomDropdownItem, CustomDropdownWrapper, NotificationItem, Typography } from '@/shared/ui';

import s from './UserNotifications.module.scss';

export const UserNotifications = () => {
  const [notifications, setNotifications] = useState<INotificationItem[]>([]);
  const ACCESS_TOKEN = localStorage.getItem('accessToken');
  const { data: notificationsData, refetch } = useGetNotificationsQuery({ cursor: 0 }); // useGetNotificationsQuery

  //const changedNotificationsRef = useRef<INotificationItem[]>([]);
  const filteredNotifications = notifications.filter((notification) => !notification.isRead);

  /*___________DROPDOWN____________*/
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleDropdownToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleItemClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    event.preventDefault();
  };
  /*___________DROPDOWN____________*/

  useEffect(() => {
    if (notificationsData && notificationsData.items) {
      setNotifications([...notificationsData.items]);
    }
  }, [notificationsData]);

  useSocket({
    events: {
      NOTIFICATION: () => {
        //refetch();
      }
    },
    onConnect: () => console.log('Connected to WebSocket server'),
    onDisconnect: () => console.log('Disconnected from WebSocket server'),
    onError: (error) => console.error('General connection error:', error),
    params: { query: { accessToken: ACCESS_TOKEN } }, // Параметры для подключения
    url: 'https://inctagram.work' // WebSocket URL
  });

  return (
    <CustomDropdownWrapper
      trigger={
        <div className={s.notificationItem} onClick={handleDropdownToggle} tabIndex={0}>
          <Outlinebell className={s.bell} />
        </div>
      }
      align={'end'}
      className={s.dropdownNotifications}
      classNameArrow={s.arrow}
      classNameTriggerActive={s.bellActive}
      stayOpen={isOpen}
      isArrow
    >
      <CustomDropdownItem className={s.notificationItemWrap} onClick={handleItemClick}>
        <div>
          <div className={s.title}>
            <Typography variant={'bold_text_16'}>Notifications</Typography>
            {filteredNotifications && filteredNotifications.length > 0 && (
              <Button className={s.clearButton} title={'Clear all'} variant={'secondary'}>
                <Typography className={s.time} variant={'small_text'}>
                  Clear all
                </Typography>
              </Button>
            )}
          </div>

          <div className={s.msgsWrapper}>
            <div className={s.msgs}>
              {filteredNotifications && filteredNotifications.length === 0 && (
                <div className={s.noNotifications}>
                  <Typography variant={'regular_text_14'}>You have no new notices</Typography>
                </div>
              )}

              {filteredNotifications &&
                filteredNotifications.length > 0 &&
                Object.values(notifications).map((notice) => (
                  <div key={notice.id}>
                    <NotificationItem id={notice.id} isRead={notice.isRead} message={notice.message} />
                  </div>
                ))}
            </div>
          </div>
          <div className={s.showMoreBtn} onClick={handleDropdownToggle}>
            <Button variant={'secondary'} fullWidth>
              <Typography variant={'small_text'}>Show more</Typography>
            </Button>
          </div>
        </div>
      </CustomDropdownItem>
    </CustomDropdownWrapper>
  );
};
