import React, { MutableRefObject, useCallback, useEffect, useRef, useState } from 'react';

import { useLazyGetNotificationsQuery } from '@/shared/api/notifications/notificationsAPI';
import { INotificationItem } from '@/shared/api/notifications/notificationsTypes';
import { IUseInfiniteScroll, useInfiniteScroll } from '@/shared/lib/hooks/useInfiniteScroll';
import { NotificationItem, Typography } from '@/shared/ui';

import s from '@/entities/userNotifications/UserNotifications.module.scss';

type Props = {
  readedNotifications: number[];
  setReadedNotifications: (readedNotices: number[]) => void;
};

const NEXT_NOTICES_COUNT = 3;

export const DropDownContent = (props: Props) => {
  const { readedNotifications, setReadedNotifications } = props;
  const [notifications, setNotifications] = useState<INotificationItem[]>([]);
  const triggerRef = useRef() as MutableRefObject<HTMLDivElement>;
  const [fetchNotices, { data: noticesData, isFetching: isNoticesFetching }] = useLazyGetNotificationsQuery();

  // Обновление уведомлений при наведении
  const handleItemHover = useCallback(
    (itemID: number) => () => {
      if (!readedNotifications.includes(itemID)) {
        setReadedNotifications([...readedNotifications, itemID]);
      }
    },
    [readedNotifications, setReadedNotifications]
  );

  // Первоначальная загрузка уведомлений
  useEffect(() => {
    fetchNotices({ pageSize: NEXT_NOTICES_COUNT });
  }, []);

  //Проверяем есть ли еще notices на сервере
  const hasNoMoreNotices = noticesData?.totalCount === notifications.length;

  const onLoadNextNotices = useCallback(() => {
    if (!isNoticesFetching && !hasNoMoreNotices && notifications.length) {
      const cursorID = notifications[notifications.length - 1]?.id;

      fetchNotices({ cursor: cursorID, pageSize: NEXT_NOTICES_COUNT });
    }
  }, [isNoticesFetching, hasNoMoreNotices, notifications, fetchNotices]);

  // Используем хук бесконечного скролла
  useInfiniteScroll({
    callBack: onLoadNextNotices,
    rootMargin: '0px',
    threshold: 0.1,
    triggerRef
  } as IUseInfiniteScroll);

  // Обновление состояния уведомлений при приходе новых данных
  useEffect(() => {
    if (noticesData?.items) {
      setNotifications((prev) => [...prev, ...noticesData.items]);
    }
  }, [noticesData]);

  return (
    <div>
      <div className={s.title}>
        <Typography variant={'bold_text_16'}>Notifications</Typography>
      </div>

      <div className={s.msgsWrapper}>
        <div>
          <div className={s.msgs}>
            {noticesData && noticesData.items.length === 0 && (
              <div className={s.noNotifications}>
                <Typography variant={'regular_text_14'}>You have no new notices</Typography>
              </div>
            )}

            {notifications.map((notice) => (
              <div key={notice.id} onMouseEnter={handleItemHover(notice.id)}>
                <NotificationItem
                  isReadedNotice={readedNotifications.includes(notice.id) || notice.isRead}
                  notice={notice}
                />
              </div>
            ))}
          </div>
          <div ref={triggerRef} style={{ opacity: 0 }}>
            .
          </div>
        </div>
      </div>
    </div>
  );
};
