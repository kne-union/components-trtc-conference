import { globalInit } from '../preset';
import getApis from '../components/Apis/getApis';
import merge from 'lodash/merge';
import dayjs from 'dayjs';

const baseApis = getApis();

const MOCK_LIST_TOTAL = 35;
const MOCK_LIST_DELAY_MS = 400;

const MEETING_NAMES = [
  '产品需求评审',
  '技术架构讨论',
  '周例会同步',
  '客户方案讲解',
  '设计走查会议',
  '迭代计划会',
  '线上问题复盘',
  '招聘面试协调',
  '运营活动筹备',
  '安全合规培训',
  '数据周报解读',
  '跨部门对齐会'
];

const MEMBER_POOL = [
  { id: 'user-001', nickname: '陈建国', email: 'chenjianguo@company.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chen' },
  { id: 'user-002', nickname: '李明辉', email: 'liminghui@company.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=li' },
  { id: 'user-003', nickname: '王芳', email: 'wangfang@company.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wang' },
  { id: 'user-004', nickname: '赵磊', email: 'zhaolei@company.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhao' },
  { id: 'user-005', nickname: '刘洋', email: 'liuyang@company.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=liuyang' },
  { id: 'user-006', nickname: '孙婷', email: 'sunting@company.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sun' },
  { id: 'user-007', nickname: '周伟', email: 'zhouwei@company.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhou' },
  { id: 'user-008', nickname: '吴晓燕', email: 'wuxiaoyan@company.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wu' }
];

const buildExtraConference = (index, template) => {
  const master = MEMBER_POOL[index % MEMBER_POOL.length];
  const guest = MEMBER_POOL[(index + 1) % MEMBER_POOL.length];
  const status = index % 7 === 0 ? 2 : index % 3 === 0 ? 1 : 0;
  const startTime = dayjs('2026-06-05T10:00:00.000Z')
    .subtract(Math.floor(index / 3), 'day')
    .add((index % 3) * 2, 'hour')
    .toISOString();
  return {
    id: `conf-${String(index + 1).padStart(3, '0')}`,
    shorten: `abc${String(index + 1).padStart(3, '0')}`,
    name: `${MEETING_NAMES[index % MEETING_NAMES.length]} #${index + 1}`,
    startTime,
    duration: [900, 1800, 2700, 3600, 5400][index % 5],
    status,
    isInvitationAllowed: index % 4 !== 0,
    maxCount: [5, 8, 10, 20, 50][index % 5],
    members: [
      Object.assign({}, master, { isMaster: true, attended: status !== 0 }),
      Object.assign({}, guest, { isMaster: false, attended: status === 1 })
    ],
    options: Object.assign({}, template?.options || { allowExtend: true, setting: { record: '', speech: false, layoutType: 1 } })
  };
};

const loadConferenceListData = (() => {
  let cache = null;
  return async () => {
    if (cache) {
      return cache;
    }
    const { default: base } = await import('./conference-list.json');
    const pageData = base.pageData.slice();
    const template = pageData[0];
    for (let i = pageData.length; i < MOCK_LIST_TOTAL; i++) {
      pageData.push(buildExtraConference(i, template));
    }
    cache = {
      totalCount: pageData.length,
      pageData
    };
    return cache;
  };
})();

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const apis = merge({}, baseApis, {
  conference: {
    getConferenceList: {
      loader: async props => {
        const data = await loadConferenceListData();
        const keyword = (props?.params?.keyword || '').trim();
        const date = props?.params?.date || '';
        const record = props?.params?.record || '';
        const speech = props?.params?.speech || '';
        let pageData = data.pageData.slice();
        if (keyword) {
          pageData = pageData.filter(item => String(item.name || '').includes(keyword));
        }
        if (date) {
          pageData = pageData.filter(item => dayjs(item.startTime).format('YYYY-MM-DD') === date);
        }
        if (record) {
          pageData = pageData.filter(item => item.options?.setting?.record === record);
        }
        if (speech) {
          pageData = pageData.filter(item => String(!!item.options?.setting?.speech) === speech);
        }
        pageData.sort((a, b) => dayjs(b.startTime).valueOf() - dayjs(a.startTime).valueOf());
        const currentPage = Math.max(1, Number(props?.params?.currentPage) || 1);
        const perPage = Math.max(1, Number(props?.params?.perPage) || 10);
        const start = (currentPage - 1) * perPage;
        await delay(MOCK_LIST_DELAY_MS);
        return {
          totalCount: pageData.length,
          pageData: pageData.slice(start, start + perPage)
        };
      }
    },
    getConferenceDetail: {
      loader: async props => {
        const data = await loadConferenceListData();
        const id = props?.params?.id || props?.data?.id;
        const conference = (id && data.pageData.find(item => item.id === id)) || data.pageData[0];
        if (!conference) {
          return null;
        }
        return { conference, member: conference.members?.[0] };
      }
    },
    createConference: {
      loader: ({ data }) => {
        return Object.assign({}, data, {
          id: 'conf-new-' + Date.now(),
          status: 0,
          shorten: 'new-' + Date.now(),
          members: data.includingMe
            ? [
                {
                  id: 'user-001',
                  nickname: '陈建国',
                  email: 'chenjianguo@company.com',
                  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chen',
                  isMaster: true
                },
                ...(data.members || [])
              ]
            : data.members || []
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
    inviteMemberFromUser: {
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
      loader: async () => {
        const data = await loadConferenceListData();
        const conference = data.pageData[0];
        return {
          conference,
          member: conference?.members?.[0],
          sign: { sdkAppId: 1400000000, userId: 'user-001', userSig: 'test_sig' }
        };
      }
    },
    endConference: {
      loader: () => null
    },
    cancelConference: {
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
    },
    recordClientEvents: {
      loader: () => null
    },
    getAiTranscriptionContent: {
      loader: () => {
        return import('./ai-transcription-content.json').then(({ default: data }) => data);
      }
    },
    getTrtcInstanceEvents: {
      loader: () => {
        return import('./trtc-instance-events.json').then(({ default: data }) => data);
      }
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
export { default as mockAiTranscriptionContent } from './ai-transcription-content.json';
export { default as mockTrtcInstanceEvents } from './trtc-instance-events.json';
export default preset;
