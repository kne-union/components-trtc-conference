import { globalInit } from '../preset';
import getApis from '../components/Apis/getApis';
import merge from 'lodash/merge';

const baseApis = getApis();

const apis = merge({}, baseApis, {
  conference: {
    getConferenceList: {
      loader: () => {
        return import('./conference-list.json').then(({ default: data }) => data);
      }
    },
    getConferenceDetail: {
      loader: ({ params }) => {
        return import('./conference-list.json').then(({ default: data }) => {
          const id = params?.id || 'conf-001';
          const conference = data.pageData.find(item => item.id === id);
          return conference || data.pageData[0];
        });
      }
    },
    createConference: {
      loader: ({ data }) => {
        return Object.assign({}, data, {
          id: 'conf-new-' + Date.now(),
          status: 0,
          shorten: 'new-' + Date.now(),
          members: data.includingMe ? [{ id: 'user-001', nickname: '陈建国', email: 'chenjianguo@company.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chen', isMaster: true }, ...(data.members || [])] : (data.members || [])
        });
      }
    },
    saveConference: {
      loader: ({ data }) => {
        return Object.assign({}, data, { id: data.id || 'conf-001' });
      }
    },
    deleteConference: {
      loader: () => null
    },
    inviteMember: {
      loader: () => {
        return import('./invite-data.json').then(({ default: data }) => data);
      }
    },
    inviteMemberFormUser: {
      loader: () => {
        return import('./invite-data.json').then(({ default: data }) => data);
      }
    },
    joinConference: {
      loader: () => {
        return import('./conference-list.json').then(({ default: data }) => data.pageData[0]);
      }
    },
    saveMember: {
      loader: ({ data }) => data
    },
    removeMember: {
      loader: () => null
    },
    enterConference: {
      loader: () => ({ sdkParams: { sdkAppId: 1400000000, userSig: 'test_sig' } })
    },
    endConference: {
      loader: () => null
    },
    getMemberShorten: {
      loader: ({ params }) => ({ shorten: 'shorten-' + (params?.id || Date.now()) })
    },
    startAITranscription: {
      loader: () => null
    },
    stopAITranscription: {
      loader: () => null
    },
    recordAITranscription: {
      loader: () => null
    }
  },
  file: {
    getUrl: {
      loader: ({ params }) => {
        if (params && params.id) {
          return params.id;
        }
        return 'https://picsum.photos/200/200';
      }
    }
  }
});

const preset = {
  ajax: async ({ loader, ...props }) => {
    if (!loader && props.url) {
      const { ajax } = await globalInit();
      return ajax({ loader, ...props });
    }
    return Promise.resolve({ data: loader ? { code: 0, data: loader(props) } : { code: 0, data: {} } });
  },
  themeToken: {
    colorPrimary: '#4F185A',
    colorPrimaryHover: '#702280'
  },
  apis: {
    conference: apis.conference
  },
  file: {
    getUrl: ({ id }) => `https://mock-api.example.com/files/${id}`
  }
};

export { default as mockConferenceList } from './conference-list.json';
export { default as mockUserInfo } from './user-info.json';
export { default as mockInviteData } from './invite-data.json';
export default preset;
