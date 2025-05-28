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
    inviteMemberFormUser: {
      url: `${prefix}/inviteMemberFormUser`,
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
    }
  };
};

export default getApis;
