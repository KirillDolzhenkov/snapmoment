import React from 'react';

import Outlinebell from '@/../public/assets/components/Outlinebell';
import { useSocket } from '@/shared/lib/hooks/useSocket';
import { CustomDropdownItem, CustomDropdownWrapper, NotificationItem } from '@/shared/ui';

import s from './UserNotifications.module.scss';

const notifications: Record<string, string> = {
  'New comments': 'New comments',
  'New followers': 'New followers',
  'New messages': 'New messages'
};

export const UserNotifications = () => {
  const ACCESS_TOKEN = localStorage.getItem('accessToken');

  useSocket({
    events: {
      NOTIFICATION: (data) => {
        console.log('NOTIFICATION:', data);
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
        <div className={s.notificationItem} tabIndex={0}>
          <Outlinebell className={s.bell} />
        </div>
      }
      align={'end'}
      className={s.DropdownNotifications}
      isArrow
    >
      <CustomDropdownItem className={s.notificationItemWrap}>
        <NotificationItem text={'Уведомления'} />
        {Object.values(notifications).map((notification) => (
          <NotificationItem key={notification} text={notification} />
        ))}
      </CustomDropdownItem>
    </CustomDropdownWrapper>
  );
};

/*const [getSocketUrl, { data: socketData }] = useLazyGetNotificationsQuery();
const { data: notificationsData, refetch } = useGetNotificationsQuery({ cursor: 0 });*/

/*const SOCKET_PARAMS = {
    query: {
      accessToken: ACCESS_TOKEN
      /!*cursor: 0,
      pageSize: 12,
      sortDirection: 'desc'*!/
    }
  };*/

/*useSocket({
  onConnect: () => console.log('Connected to socket.io server'),
  onDisconnect: () => console.log('Disconnected from socket.io server'),
  onError: (error) => console.error('Socket error:', error),
  onMessage: (newMessage) => {
    console.log('New message received:', newMessage);
    //refetch();
  },
  params: SOCKET_PARAMS,
  url: 'https://inctagram.work'
});*/

/*useEffect(() => {
  const socket = io('https://inctagram.work', SOCKET_PARAMS);

  socket.on('connect', () => {
    console.log('Connected to socket.io server');
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from socket.io server');
  });

  socket.on('NOTIFICATION', (data) => {
    const { message, type } = data;

    console.log('NOTIFICATION:', data);
  });

  return () => {
    socket.disconnect();
  };
}, []);*/
