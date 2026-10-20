import Im, { ImConnection, useIm } from '@components/Im';
import { useContext } from '../App/context';

const conferenceImOptions = {
  sessionUrl: '/api/v1/conference/im/session',
  devApiHost: process.env.NODE_ENV === 'development' ? 'localhost:8042' : undefined
};

const ConferenceChat = props => {
  const { apiBase } = useContext();
  return <Im {...conferenceImOptions} {...(apiBase ? { apiBase } : {})} {...props} />;
};

export const ConferenceImConnection = () => {
  const { apiBase } = useContext();
  return <ImConnection {...conferenceImOptions} {...(apiBase ? { apiBase } : {})} />;
};

export const useConferenceIm = useIm;

export default ConferenceChat;
