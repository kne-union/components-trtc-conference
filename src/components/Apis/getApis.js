const getApis = options => {
  const { prefix } = Object.assign({}, { prefix: '/api/conference' }, options);

  return {
    getConferenceList: {
      url: `${prefix}/list`,
      method: 'GET'
    },
    getConferenceDetail: {
      url: `${prefix}/detail`,
      method: 'GET'
    },
    saveMember: {
      url: `${prefix}/saveMember`,
      method: 'POST'
    },
    inviteMember: {
      url: `${prefix}/inviteMember`,
      method: 'POST'
    },
    inviteMemberFromUser: {
      url: `${prefix}/inviteMemberFromUser`,
      method: 'POST'
    },
    joinConference: {
      url: `${prefix}/join`,
      method: 'POST'
    },
    removeMember: {
      url: `${prefix}/removeMember`,
      method: 'POST'
    },
    enterConference: {
      url: `${prefix}/enter`,
      method: 'POST'
    },
    endConference: {
      url: `${prefix}/end`,
      method: 'POST'
    },
    cancelConference: {
      url: `${prefix}/cancel`,
      method: 'POST'
    },
    startAITranscription: {
      url: `${prefix}/startAITranscription`,
      method: 'POST'
    },
    stopAITranscription: {
      url: `${prefix}/stopAITranscription`,
      method: 'POST'
    },
    recordAITranscription: {
      url: `${prefix}/recordAITranscription`,
      method: 'POST'
    },
    recordClientEvents: {
      url: `${prefix}/recordClientEvents`,
      method: 'POST'
    },
    getAiTranscriptionContent: {
      url: `${prefix}/getAiTranscriptionContent`,
      method: 'GET'
    },
    getTrtcInstanceEvents: {
      url: `${prefix}/getTrtcInstanceEvents`,
      method: 'GET'
    },
    createConference: {
      url: `${prefix}/create`,
      method: 'POST'
    },
    saveConference: {
      url: `${prefix}/save`,
      method: 'POST'
    },
    deleteConference: {
      url: `${prefix}/delete`,
      method: 'POST'
    },
    getMemberShorten: {
      url: `${prefix}/getMemberShorten`,
      method: 'GET'
    },
    extendDuration: {
      url: `${prefix}/extendDuration`,
      method: 'POST'
    }
  };
};

export default getApis;
