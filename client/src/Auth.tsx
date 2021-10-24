import { FC, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    getPerformedRefract, getStatusOfRightToUsePlizm, listenAuthState
} from 'reducks/users/operations';
import { getIsSignedIn } from 'reducks/users/selectors';
import { Users } from 'util/types/redux/users';

const Auth: FC = ({ children }) => {
  const dispatch = useDispatch()

  const selector = useSelector((state: { users: Users }) => state)
  const isSignedIn = getIsSignedIn(selector)

  useEffect(() => {
    if (!isSignedIn) {
      dispatch(listenAuthState())
    }
    dispatch(getStatusOfRightToUsePlizm())
    dispatch(getPerformedRefract())
  }, [dispatch, isSignedIn])

  if (!isSignedIn) return <></>

  return <>{children}</>
}

export default Auth
