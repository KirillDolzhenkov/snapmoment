import { ReSendPost, ToggleFavorites, ToggleLike } from '@/features';
import { useMeQuery } from '@/shared/api/auth/authApi';
import { useGetPostLikesQuery, useUpdateLikePostMutation } from '@/shared/api/posts/postsApi';
import { GetPostLikesResponse } from '@/shared/api/posts/postsTypes';
import { GetPostByIdResponse } from '@/shared/api/public/publicTypes';
import { LikeStatus, useAppDispatch } from '@/shared/lib';

import s from './PostInteractionBar.module.scss';

type Props = {
  postData: GetPostByIdResponse;
  postId: number;
  postLikes?: GetPostLikesResponse;
};

export const PostInteractionBar = ({ postData, postId, postLikes }: Props) => {
  const { data: me } = useMeQuery();
  const [updateLikePost] = useUpdateLikePostMutation();
  const { refetch } = useGetPostLikesQuery({ postId: postId || null });
  const dispatch = useAppDispatch();

  const isMyLike = !!postLikes?.items?.find((item) => item.userId === me?.userId);
  const updateLikeStatusHandler = async () => {
    try {
      await updateLikePost({
        likeStatus: isMyLike ? LikeStatus.NONE : LikeStatus.LIKE,
        postId: postData?.id
      });
      refetch();
      // dispatch(snapmomentAPI.util.invalidateTags(['publicPostLikes']));
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <div className={s.activitesBtn}>
      <div className={s.group}>
        <ToggleLike isMyLike={isMyLike} updateLikeStatus={updateLikeStatusHandler} />
        <ReSendPost />
      </div>
      <ToggleFavorites />
    </div>
  );
};
