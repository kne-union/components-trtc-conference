const { default: ConferenceDocument } = _ConferenceDocument;
const { default: preset } = _mockPreset;
const { createWithRemoteLoader } = remoteLoader;

const LONG_NAME =
  '2026年Q2产品规划与跨部门协作方案-最终版-含附录与修订记录-v3.2.1.pdf';

const MANY_FILES = [
  { filename: LONG_NAME, id: 'file-001' },
  { filename: '竞品分析报告.xlsx', id: 'file-002' },
  { filename: '技术架构概览.pdf', id: 'file-003' },
  { filename: '用户访谈纪要-华东区-2026-03.docx', id: 'file-004' },
  { filename: '预算明细表-市场部与产品部联合评审.xlsx', id: 'file-005' },
  { filename: '视觉设计规范.pdf', id: 'file-006' },
  { filename: '接口文档-会议模块-OpenAPI.yaml', id: 'file-007' },
  { filename: '上线检查清单.md', id: 'file-008' },
  { filename: '客户反馈汇总-超长文件名用于验证省略显示效果-请打开下拉查看完整列表.html', id: 'file-009' },
  { filename: '附录A-参考资料.pdf', id: 'file-010' }
];

const BaseExample = createWithRemoteLoader({
  modules: ['components-core:Global@PureGlobal']
})(({ remoteModules }) => {
  const [PureGlobal] = remoteModules;
  return (
    <PureGlobal preset={preset}>
      <div style={{ height: 500, maxWidth: 420, border: '1px dashed #d9d9d9', padding: 12, boxSizing: 'border-box' }}>
        <ConferenceDocument type="files" files={MANY_FILES} />
      </div>
    </PureGlobal>
  );
});

render(<BaseExample />);
