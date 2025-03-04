// @flow
import * as React from 'react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import PersonOutline from '@/../public/assets/components/PersonOutline';
import {
  useGetUserProfileQuery,
  usePublishPostsImageMutation,
  usePublishPostsMutation
} from '@/shared/api/profile/profileApi';
import { publicApi } from '@/shared/api/public/publicApi';
import { useAppDispatch, useAppSelector, useCustomToast } from '@/shared/lib';
import { FormTextfield, FormTextfieldArea, Typography } from '@/shared/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { z } from 'zod';

import s from './PublishPost.module.scss';

import { useRefreshPostCreationData } from '../../hooks/useRefreshPostCreationData';
import { createPostSelectors } from '../../service/createPostSlice';

type Props = {
  changeEditMode?: () => void;
  className?: string;
  description?: string;
  isLocationBar?: boolean;
  newDescriptionHandler?: (val: string) => void;
  postId?: number;
  submitRef?: React.RefObject<HTMLButtonElement>;
  type?: 'create' | 'edit';
};
const addPostSchema = z.object({
  description: z
    .string()
    .min(1, { message: 'Description is required' })
    .max(500, { message: 'Description should be less than 500 characters' }),
  location: z.string().optional()
});

export type AddPostType = z.infer<typeof addPostSchema>;

/**
 * Компонент для отправки запроса на сохранение поста
 * @description Форма есть, НО КАК ПРИВЯЗАТЬ submit к кнопке Publish у родителя?! Правильно - используем ref.  От родителя кинули сюда, привязали к button и этот button скрыли. Также как с инпутами для файлов.
 * @description Чтобы отправить пост, нужно использовать 2 запроса. Первый - publishPostImages, отправляет чисто картинки, второй - использует ответ от первого (idКартинок - childrenMetaData) И описание из формы (НО НЕ Location). Почему без Location я ХЗ
 * @description Для удаления поста используем опять 2 запроса, для картинок и для описания
 * * submitRef {React.RefObject<HTMLButtonElement>} - ref от родителя. Нужен для того, чтобы у родителя, на кнопке Publish сделать submitRef.current.click(), - запустить процесс отправки формы
 * * isLocationBar {boolean} - говорит, нужно ли показывать блок с Location. По умолчанию true
 * * type {'create' | 'edit'} - По умолчанию create - для создания поста. Если edit, то будет показываться форма для редактирования
 * * description {string} - Описание к посту, если передано
 * * postId {number} - Id поста, если передано
 * * changeEditMode {() => void} - Если передано - для изменения вида модалки
 */
export const PublishPost = (props: Props) => {
  const {
    changeEditMode,
    className,
    description,
    isLocationBar = true,
    newDescriptionHandler,
    postId,
    submitRef,
    type = 'create'
  } = props;

  const dispatch = useAppDispatch();
  const router = useRouter();
  const allPostImages = useAppSelector(createPostSelectors.allPostImages);
  const { showToast } = useCustomToast();
  const { refreshPostCreationData } = useRefreshPostCreationData();

  const { data: profileData } = useGetUserProfileQuery();
  const [publishPostImages, { isLoading: isLoadingImages }] = usePublishPostsImageMutation();
  const [publishPostDescription, { isLoading: isLoadingDescription }] = usePublishPostsMutation();
  // const [updatePost, { isLoading: isLoadingUpdatePost }] = useUpdateUsersPostMutation();

  // toastId нужен для того, чтобы управлять одним и тем же тостером в разных запросах. Если не использовать toastId, то каждый вызов showToast будет создавать новый тостер.
  const [toastId, setToastId] = useState<null | number | string>(null);

  const refresh = () => {
    dispatch(publicApi.util.resetApiState()); // Сбрасываем кэш => перезагружаем запросы. Я ХУЙ ЕГО ЗНАЕТ ЗАЧЕМ, но так рекомендовал GPT
    refreshPostCreationData(); // Сбрасываем стейт слайса
  };

  const {
    control,
    formState: { errors, isValid },
    handleSubmit,
    register,
    setValue,
    watch
  } = useForm<AddPostType>({ mode: 'onSubmit', resolver: zodResolver(addPostSchema) });

  useEffect(() => {
    if (description) {
      setValue('description', description); // устанавливаем значение в поле через setValue
    }
  }, [description, setValue]); // вызываем, когда изменяется description

  const onSubmit = async (data: AddPostType) => {
    if (type === 'edit') {
      newDescriptionHandler?.(data.description as string);

      return;
    }

    showToast({ message: 'Publishing post...', type: 'loading' });

    try {
      const files = await Promise.all(
        allPostImages.map(async (el) => {
          const response = await fetch(el.buferUrl);
          const blob = await response.blob();

          // Создаем объект File, используя Blob
          return new File([blob], `${el.id}.jpg`, { type: blob.type }); // Имя файла можно задать по вашему усмотрению
        })
      );

      // Отправляем файлы на сервер
      const res = await publishPostImages(files).unwrap();

      const childrenMetadata = res.images.map((el) => ({ uploadId: el.uploadId }));

      await publishPostDescription({ childrenMetadata, description: data.description as string });

      // Сброс кэша для обновления данных
      dispatch(publicApi.util.invalidateTags(['PublicPosts', 'PublicPostsByUserName', 'PostsByUserName']));

      refresh();

      showToast({ message: 'Post successfully published', type: 'success' });

      router.reload();
    } catch (error) {
      showToast({ message: `Error occurred while publishing post: ${error}`, type: 'error' });
    } finally {
      setToastId(null);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <button ref={submitRef} style={{ display: 'none' }} type={'submit'}>
        submit
      </button>
      <div className={s.container}>
        <div className={s.upperSection}>
          <div className={s.userData}>
            {profileData?.avatars[0] ? (
              <Image alt={'postImg'} className={s.avatar} height={100} src={profileData.avatars[0].url} width={100} />
            ) : (
              <PersonOutline className={s.avatarBordered} />
            )}
            <Typography variant={'h3'}>{profileData?.userName}</Typography>
          </div>

          <div className={s.textAreaWrapper}>
            <FormTextfieldArea
              classNameTextAreaSize={s.textAreaSize}
              control={control}
              counterValue={`${watch('description')?.length || 0}/500`}
              currentValue={description ?? undefined}
              error={errors.description?.message}
              label={'Add publication descriptions'}
              maxLength={500}
              name={'description'}
              placeholder={'Text-area'}
              resize
            />
          </div>
        </div>
        {isLocationBar && (
          <div className={s.locationBox}>
            <FormTextfield
              control={control}
              error={errors.location?.message}
              label={'Add location'}
              name={'location'}
              placeholder={'Location'}
              style={{ background: 'transparent', border: '1px solid #4C4C4C' }}
              type={'location'}
            />
          </div>
        )}
      </div>
    </form>
  );
};
