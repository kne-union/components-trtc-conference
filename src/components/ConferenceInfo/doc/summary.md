会议信息管理组件集，提供会议列表展示、会议创建与编辑、成员管理、会议详情查看、邀请成员等完整的会议信息管理功能。

包含以下子组件：
- **ConferenceInfo**：会议信息主组件，展示会议列表和侧边栏操作菜单
- **ConferenceFormInner**：会议表单内部组件，用于创建和编辑会议的表单字段
- **MemberFormInner**：成员表单内部组件，用于编辑参会成员信息
- **ConferenceDetail**：会议详情组件，展示会议详情、参会人员、会议文档和录制资源；房间情况通过独立组件 `RoomEvents` 展示
- **InviteMember**：邀请成员组件，生成邀请链接和会议信息

房间情况展示请使用独立组件 `RoomEvents`（`components-trtc-conference:RoomEvents`），可被 unfolds 等平台直接复用。
