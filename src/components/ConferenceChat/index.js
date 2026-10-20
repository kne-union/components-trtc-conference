import Im, { ImConnection, useIm } from '@components/Im';

const conferenceImOptions = {
  sessionUrl: '/api/v1/conference/im/session',
  devApiHost: process.env.NODE_ENV === 'development' ? 'localhost:8042' : undefined
};

const ConferenceChat = props => <Im {...conferenceImOptions} {...props} />;

export const ConferenceImConnection = () => <ImConnection {...conferenceImOptions} />;

export const useConferenceIm = useIm;

export default ConferenceChat;
