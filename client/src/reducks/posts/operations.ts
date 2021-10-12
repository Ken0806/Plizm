import camelcaseKeys from 'camelcase-keys';
import { SetStateAction } from 'react';
import { getThread } from 'reducks/threads/operations';
import { UsersOfGetState } from 'reducks/users/types';
import { createRequestHeader } from 'Util/common';

import { axiosBase } from '../../api';
import DefaultIcon from '../../assets/DefaultIcon.jpg';
import { getPostsOfMeAndFollowerAction } from './actions';
import {
    PostsArrayOfMeAndFollowerResponse, PostsOfMeAndFollower, SubmitPostOperation,
    SubmitReplyOperation
} from './types';

export const getPostsOfMeAndFollower =
  () =>
  async (
    dispatch: (arg0: { type: string; payload: PostsOfMeAndFollower[] }) => void,
    getState: UsersOfGetState,
  ): Promise<void> => {
    const requestHeaders = createRequestHeader(getState)

    await axiosBase
      .get<PostsArrayOfMeAndFollowerResponse>('/v1/posts/me_and_followers', { headers: requestHeaders })
      .then((response) => {
        const { posts } = response.data
        const postsWithCamelcaseKeys = posts.map((post) => camelcaseKeys(post))
        const postsWithIcon: Array<PostsOfMeAndFollower> = postsWithCamelcaseKeys.map((post) => {
          const iconUrl = post.iconUrl == null ? DefaultIcon : post.iconUrl
          const postWithIcon = { ...post, iconUrl }

          return postWithIcon
        })

        dispatch(getPostsOfMeAndFollowerAction(postsWithIcon))
      })
      .catch((errors) => {
        console.log(errors)
      })
  }

export const submitNewPost: SubmitPostOperation =
  (locked, content, image) => async (dispatch: any, getState: UsersOfGetState) => {
    const requestHeaders = createRequestHeader(getState)

    const requestData = new FormData()
    if (content) requestData.append('content', content)
    requestData.append('is_locked', locked.toString())
    if (image) requestData.append('image', image)

    await axiosBase
      .post('/v1/posts', requestData, { headers: requestHeaders })
      .then(() => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        dispatch(getPostsOfMeAndFollower())
      })
      .catch((errors) => {
        console.log(errors)
      })
  }

export const submitReply: SubmitReplyOperation =
  (repliedPostId, locked, content, image) => async (dispatch: any, getState: UsersOfGetState) => {
    const requestHeaders = createRequestHeader(getState)

    const requestData = new FormData()
    if (content) requestData.append('content', content)
    requestData.append('is_locked', locked.toString())
    if (image) requestData.append('image', image)

    await axiosBase
      .post(`/v1/posts/${repliedPostId}/replies`, requestData, { headers: requestHeaders })
      .then(() => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        dispatch(getPostsOfMeAndFollower())
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        dispatch(getThread(repliedPostId))
      })
      .catch((errors) => {
        console.log(errors)
      })
  }

export const deletePost =
  (postId: string) =>
  async (dispatch: any, getState: UsersOfGetState): Promise<void> => {
    const requestHeaders = createRequestHeader(getState)

    await axiosBase
      .delete(`/v1/posts/${postId}`, { headers: requestHeaders })
      .then(() => {
        // eslint-disable-next-line no-restricted-globals
        history.go(0)
      })
      .catch((errors) => {
        console.log(errors)
      })
  }

export const changeLockStateOfPost =
  (
    postId: string,
    isLocked: boolean,
    setIsLocked: {
      (value: SetStateAction<boolean>): void
    },
  ) =>
  async (_: unknown, getState: UsersOfGetState): Promise<void> => {
    const requestHeaders = createRequestHeader(getState)

    await axiosBase
      .put(`/v1/posts/${postId}/change_lock`, { data: undefined }, { headers: requestHeaders })
      .then(() => {
        setIsLocked(!isLocked)
      })
      .catch((errors) => {
        console.log(errors)
      })
  }

export const unlikePost =
  (
    postId: string,
    setIsLikedByMe: (isLikedByMe: boolean) => void,
    setCountOfLikes: (countOfLikes: number) => void,
    likesCount?: number,
  ) =>
  async (_: unknown, getState: UsersOfGetState): Promise<void> => {
    const requestHeaders = createRequestHeader(getState)

    await axiosBase
      .delete(`/v1/posts/${postId}/likes`, { headers: requestHeaders })
      .then(() => {
        setIsLikedByMe(false)
        if (likesCount != null) setCountOfLikes(likesCount - 1)
      })
      .catch((errors) => {
        console.log(errors)
      })
  }

export const likePost =
  (
    postId: string,
    setIsLikedByMe: (isLikedByMe: boolean) => void,
    setCountOfLikes: (countOfLikes: number) => void,
    likesCount?: number,
  ) =>
  async (_: unknown, getState: UsersOfGetState): Promise<void> => {
    const requestHeaders = createRequestHeader(getState)

    await axiosBase
      .post(`/v1/posts/${postId}/likes`, { data: undefined }, { headers: requestHeaders })
      .then(() => {
        setIsLikedByMe(true)
        if (likesCount != null) setCountOfLikes(likesCount + 1)
      })
      .catch((errors) => {
        console.log(errors)
      })
  }
