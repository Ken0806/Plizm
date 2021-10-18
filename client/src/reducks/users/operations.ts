/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { push } from 'connected-react-router';
import Cookies from 'js-cookie';
import { createRequestHeader, isValidEmailFormat } from 'util/functions/common';
import { ErrorStatus } from 'util/types/common';

import DefaultIcon from '../../assets/img/DefaultIcon.jpg';
import { axiosBase } from '../../util/api';
import {
    ListenAuthStateRequest, SignInRequest, SignUpRequest, SignUpResponse, UsersOfGetState
} from '../../util/types/redux/users';
import { disableLockDescriptionAction, signInAction, signOutAction, signUpAction } from './actions';

export const signUp =
  (
    email: string,
    password: string,
    passwordConfirmation: string,
    setError: React.Dispatch<React.SetStateAction<string>>,
  ) =>
  async (dispatch: any): Promise<void> => {
    if (email === '' || password === '' || passwordConfirmation === '') {
      setError('必須項目が未入力です。')

      return
    }

    if (!isValidEmailFormat(email)) {
      setError('メールアドレスの形式が不正です。')

      return
    }

    if (password.length < 8) {
      setError('パスワードは8文字以上で設定してください。')

      return
    }

    if (password !== passwordConfirmation) {
      setError('パスワードが一致しません。')

      return
    }

    const requestData: SignUpRequest = { email, password, password_confirmation: passwordConfirmation }

    await axiosBase
      .post<SignUpResponse>('/v1/auth', requestData)
      .then((response) => {
        const { headers } = response
        const accessToken: string = headers['access-token']
        const { client, uid } = headers
        Cookies.set('access-token', accessToken)
        Cookies.set('client', client)
        Cookies.set('uid', uid)

        const userData = response.data.data
        const icon = userData.image.url == null ? DefaultIcon : userData.image.url
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        dispatch(
          signUpAction({
            uid,
            accessToken,
            client,
            userId: userData.userid,
            userName: userData.username,
            icon,
            needDescriptionAboutLock: userData.need_description_about_lock,
          }),
        )
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        dispatch(push('/home'))
      })
      .catch((error) => {
        const errorsMessages: Array<string> = error?.response?.data?.errors?.full_messages
        if (errorsMessages?.some((message) => message === 'Email has already been taken')) {
          setError('すでに登録済みのメールアドレスです。\n別のメールアドレスで登録してください。')

          return
        }
        if (errorsMessages?.some((message) => message === 'Email is not an email')) {
          setError('不正なメールアドレスです。\nメールアドレスに間違えがないか確認して下さい。')

          return
        }
        setError('不正なリクエストです。')
      })
  }

export const signIn =
  (email: string, password: string, setError: React.Dispatch<React.SetStateAction<string>>) =>
  async (dispatch: any): Promise<void> => {
    if (email === '' || password === '') {
      setError('メールアドレスとパスワードを入力してください。')

      return
    }

    if (!isValidEmailFormat(email)) {
      setError('メールアドレスの形式が不正です。')

      return
    }

    const requestData: SignInRequest = { email, password }

    await axiosBase
      .post('/v1/auth/sign_in', requestData)
      .then((response) => {
        const { headers } = response
        const accessToken = headers['access-token']
        const { client, uid } = headers

        Cookies.set('access-token', accessToken)
        Cookies.set('client', client)
        Cookies.set('uid', uid)

        const userData = response.data.data
        const icon = userData.image.url == null ? DefaultIcon : userData.image.url
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        dispatch(
          signInAction({
            uid,
            accessToken,
            client,
            userId: userData.userid,
            userName: userData.username,
            icon,
            needDescriptionAboutLock: userData.need_description_about_lock,
          }),
        )
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        dispatch(push('/home'))
      })
      .catch(() => {
        setError('オフラインか、メールアドレスまたはパスワードが間違っています。')
      })
  }

export const signOut =
  (setError: React.Dispatch<React.SetStateAction<string>>) =>
  async (dispatch: any, getState: UsersOfGetState): Promise<void> => {
    const requestHeaders = createRequestHeader(getState)

    await axiosBase
      .delete('v1/auth/sign_out', { headers: requestHeaders })
      .then(() => {
        Cookies.remove('access-token')
        Cookies.remove('client')
        Cookies.remove('uid')

        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        dispatch(signOutAction())
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        dispatch(push('/'))
      })
      .catch(() => {
        setError('オフラインでないことを確認して、もう一度ログアウトして下さい。')
      })
  }

export const listenAuthState =
  () =>
  async (dispatch: any): Promise<void> => {
    const accessTokenInCookie = Cookies.get('access-token')
    const clientInCookie = Cookies.get('client')
    const uidInCookie = Cookies.get('uid')

    const requestData: ListenAuthStateRequest = {
      'access-token': accessTokenInCookie,
      client: clientInCookie,
      uid: uidInCookie,
    }

    await axiosBase
      .get('/v1/auth/validate_token', { params: requestData })
      .then((response) => {
        const { headers } = response
        const accessToken: string = headers['access-token']
        const { client, uid } = headers

        Cookies.set('access-token', accessToken)
        Cookies.set('client', client)
        Cookies.set('uid', uid)

        const userData = response.data.data
        const { userid, username } = userData
        const icon = userData.image.url == null ? DefaultIcon : userData.image.url
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        dispatch(
          signInAction({
            uid,
            accessToken,
            client,
            userId: userid,
            userName: username,
            icon,
            needDescriptionAboutLock: userData.need_description_about_lock,
          }),
        )
      })
      .catch(() => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        dispatch(push('/'))
      })
  }

export const sendMailOfPasswordReset =
  (email: string, setError: React.Dispatch<React.SetStateAction<string>>) =>
  async (dispatch: any): Promise<unknown> => {
    if (email === '') {
      setError('メールアドレスが未入力です。')

      return
    }

    if (!isValidEmailFormat(email)) {
      setError('メールアドレスの形式が不正です。')

      return
    }

    let redirectUrl
    switch (process.env.NODE_ENV) {
      case 'production':
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        redirectUrl = `${process.env.REACT_APP_PROD_CLIENT_URL}/users/password_reset`
        break

      case 'development':
      case 'test':
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        redirectUrl = `${process.env.REACT_APP_DEV_CLIENT_URL}/users/password_reset`
        break

      default:
        break
    }

    await axiosBase
      .post('/v1/auth/password', { email, redirect_url: redirectUrl })
      .then(() => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        dispatch(push('/users/sent_mail_of_password_reset'))
      })
      .catch(() => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        dispatch(push('/users/sent_mail_of_password_reset'))
      })
  }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const resetPassword =
  (
    password: string,
    passwordConfirmation: string,
    accessToken: string | null,
    client: string | null,
    uid: string | null,
    setError: React.Dispatch<React.SetStateAction<string>>,
  ) =>
  async (dispatch: any): Promise<void> => {
    if (password === '' || passwordConfirmation === '') {
      setError('必須項目が未入力です。')

      return
    }

    if (password.length < 8) {
      setError('パスワードは8文字以上で設定してください。')

      return
    }

    if (password !== passwordConfirmation) {
      setError('パスワードが一致しません。')

      return
    }

    const requestHeaders = {
      'access-token': accessToken,
      client,
      uid,
    }

    await axiosBase
      .put('/v1/auth/password', { password, password_confirmation: passwordConfirmation }, { headers: requestHeaders })
      .then((response) => {
        const { headers } = response
        const accessTokenInHeader = headers['access-token']
        const clientInHeader = headers.client
        const uidInHeader = headers.uid

        Cookies.set('access-token', accessTokenInHeader)
        Cookies.set('client', clientInHeader)
        Cookies.set('uid', uidInHeader)

        const userData = response.data.data
        const icon = userData.image.url == null ? DefaultIcon : userData.image.url
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        dispatch(
          signInAction({
            uid: uidInHeader,
            accessToken: accessTokenInHeader,
            client: clientInHeader,
            userId: userData.userid,
            userName: userData.username,
            icon,
            needDescriptionAboutLock: userData.need_description_about_lock,
          }),
        )
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        dispatch(push('/users/end_password_reset'))
      })
      .catch(() => {
        setError(
          '予期せぬエラーが発生しました。オフラインでないか確認し、それでもエラーが発生する場合はお問い合わせフォームにて問い合わせ下さい。',
        )
      })
  }

export const disableLockDescription =
  () =>
  async (
    dispatch: (arg0: { type: string; payload: { needDescriptionAboutLock: false } }) => void,
    getState: UsersOfGetState,
  ): Promise<void> => {
    const requestHeaders = createRequestHeader(getState)

    await axiosBase
      .put(`/v1/disable_lock_description`, { data: undefined }, { headers: requestHeaders })
      .then(() => {
        dispatch(
          disableLockDescriptionAction({
            needDescriptionAboutLock: false,
          }),
        )
      })
      .catch((errors) => {
        console.log(errors)
      })
  }

export const ChangeProfile =
  (userName: string, bio?: string, icon?: File) =>
  async (dispatch: any, getState: UsersOfGetState): Promise<void> => {
    const requestData = new FormData()
    requestData.append('username', userName)
    if (bio) requestData.append('bio', bio)
    if (icon) requestData.append('image', icon)

    const requestHeaders = createRequestHeader(getState)

    await axiosBase
      .put<SignUpResponse>('/v1/auth', requestData, { headers: requestHeaders })
      .then((response) => {
        const { headers } = response
        const accessToken: string = headers['access-token']
        const { client, uid } = headers
        const userData = response.data.data
        const userIcon = userData.image.url == null ? DefaultIcon : userData.image.url

        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        dispatch(
          signInAction({
            uid,
            accessToken,
            client,
            userId: userData.userid,
            userName: userData.username,
            icon: userIcon,
            needDescriptionAboutLock: userData.need_description_about_lock,
          }),
        )
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        dispatch(push(`/${userData.userid}`))
      })
      .catch((errors) => {
        console.log(errors)
      })
  }

export const EditUserId =
  (userId: string, setError: React.Dispatch<React.SetStateAction<string>>) =>
  async (dispatch: any, getState: UsersOfGetState): Promise<void> => {
    const requestHeaders = createRequestHeader(getState)

    await axiosBase
      .put<SignUpResponse>('/v1/auth', { userid: userId }, { headers: requestHeaders })
      .then((response) => {
        const { headers } = response
        const accessToken: string = headers['access-token']
        const { client, uid } = headers
        const userData = response.data.data
        const userIcon = userData.image.url == null ? DefaultIcon : userData.image.url

        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        dispatch(
          signInAction({
            uid,
            accessToken,
            client,
            userId: userData.userid,
            userName: userData.username,
            icon: userIcon,
            needDescriptionAboutLock: userData.need_description_about_lock,
          }),
        )
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        dispatch(push(`/${userData.userid}`))
      })
      .catch((errors: ErrorStatus) => {
        if (errors.response.status === 422) {
          setError('すでに登録済みのIDです。他のIDをお試し下さい。')
        }
      })
  }

export const EditEmail =
  (email: string, setError: React.Dispatch<React.SetStateAction<string>>) =>
  async (dispatch: any, getState: UsersOfGetState): Promise<void> => {
    if (!isValidEmailFormat(email)) {
      setError('メールアドレスの形式が不正です。')

      return
    }

    const requestHeaders = createRequestHeader(getState)

    await axiosBase
      .put<SignUpResponse>('/v1/auth', { email }, { headers: requestHeaders })
      .then((response) => {
        const { headers } = response
        const accessToken: string = headers['access-token']
        const { client, uid } = headers
        const userData = response.data.data
        const userIcon = userData.image.url == null ? DefaultIcon : userData.image.url

        Cookies.set('access-token', accessToken)
        Cookies.set('client', client)
        Cookies.set('uid', uid)

        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        dispatch(
          signInAction({
            uid,
            accessToken,
            client,
            userId: userData.userid,
            userName: userData.username,
            icon: userIcon,
            needDescriptionAboutLock: userData.need_description_about_lock,
          }),
        )

        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        dispatch(push(`/${userData.userid}`))
      })
      .catch((errors: ErrorStatus) => {
        if (errors.response.status === 422) {
          setError('すでに登録済みのメールアドレスです。他のメールアドレスを設定して下さい。')
        } else {
          setError('不明なエラーが発生しました。システム管理者にお問い合わせ下さい。')
        }
      })
  }
