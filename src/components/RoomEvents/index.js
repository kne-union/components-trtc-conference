import { createWithRemoteLoader } from '@kne/remote-loader';
import { Flex, Alert, Empty, Descriptions, Tabs } from 'antd';
import { DesktopOutlined, UserOutlined, WifiOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import classnames from 'classnames';
import { defaultColors } from '@kne/react-box';
import { UAParser } from 'ua-parser-js';
import { useIntl } from '@kne/react-intl';
import { useEffect, useMemo, useState } from 'react';
import withLocale from './withLocale';
import style from './style.module.scss';

const SERIES_LABEL_IDS = {
  uplinkNetworkQuality: 'UplinkNetworkQuality',
  downlinkNetworkQuality: 'DownlinkNetworkQuality',
  rtt: 'RTT(ms)',
  upLoss: 'UpLoss',
  downLoss: 'DownLoss',
  audioBitrate: 'AudioBitrate',
  audioLevel: 'AudioLevelPercent',
  videoBitrate: 'VideoBitrate',
  frameRate: 'FrameRate'
};

const METRIC_LABEL_IDS = {
  rtt: 'RttMetric',
  packetLoss: 'PacketLoss',
  frameRate: 'FrameRate',
  audioLevel: 'AudioLevel'
};

const EVENT_CODE_IDS = {
  'Client.enter': 'EventEnterRoom',
  'Client.exit': 'EventExitRoom',
  'Client.camera-open': 'EventCameraOpen',
  'Client.camera-close': 'EventCameraClose',
  'Client.microphone-open': 'EventMicrophoneOpen',
  'Client.microphone-close': 'EventMicrophoneClose',
  'Client.camera-switch': 'EventCameraSwitch',
  'Client.microphone-switch': 'EventMicrophoneSwitch',
  'Client.device-info': 'EventDeviceInfo',
  'DescribeCallDetailInfo.User': 'EventUserInfo',
  '103': 'EventRoomDismiss',
  enter: 'EventEnterRoom',
  exit: 'EventExitRoom'
};

const RoomEvents = createWithRemoteLoader({
  modules: ['components-core:InfoPage@Flow', 'components-thirdparty:Echart']
})(
  withLocale(({ remoteModules, className, id, name, status: _status, members = [], data }) => {
    const [Flow, Echart] = remoteModules;
    const { formatMessage } = useIntl();
    const [now, setNow] = useState(() => Date.now());
    const [activeMemberKey, setActiveMemberKey] = useState(null);

    const overview = data?.overview || {};
    const summary = data?.summary || {};
    const memberSummaries = data?.members || [];

    const getMemberName = member => member?.nickname || member?.email || formatMessage({ id: 'DefaultUser' });
    const getUserNameById = userId => {
      const member = members.find(item => String(item.id) === String(userId));
      if (member) {
        return getMemberName(member);
      }
      const summaryMember = memberSummaries.find(item => String(item.userId) === String(userId));
      if (summaryMember?.userId) {
        return String(summaryMember.userId);
      }
      return userId === '-' ? formatMessage({ id: 'DefaultUser' }) : userId;
    };

    const formatSeriesName = key => {
      if (SERIES_LABEL_IDS[key] === 'RTT(ms)') {
        return 'RTT(ms)';
      }
      if (SERIES_LABEL_IDS[key] === 'AudioLevelPercent') {
        return `${formatMessage({ id: 'AudioLevel' })}(%)`;
      }
      if (SERIES_LABEL_IDS[key]) {
        return formatMessage({ id: SERIES_LABEL_IDS[key] });
      }
      return key;
    };

    const formatAnalysisMetric = metric => {
      if (!metric) {
        return '';
      }
      if (typeof metric === 'string') {
        return metric;
      }
      const labelId = METRIC_LABEL_IDS[metric.key];
      const label = labelId ? formatMessage({ id: labelId }) : metric.key;
      return `${label} ${metric.value}`;
    };

    const formatEventType = code => {
      const messageId = EVENT_CODE_IDS[code];
      if (messageId) {
        return formatMessage({ id: messageId });
      }
      return `${formatMessage({ id: 'EventCode' })}: ${code || '-'}`;
    };

    const formatConnection = connection => {
      if (!connection) {
        return '-';
      }
      return [
        connection.effectiveType,
        connection.downlink !== undefined ? `${formatMessage({ id: 'Downlink' })}: ${connection.downlink}Mbps` : null,
        connection.rtt !== undefined ? `RTT: ${connection.rtt}ms` : null,
        connection.saveData ? formatMessage({ id: 'SaveDataMode' }) : null
      ]
        .filter(Boolean)
        .join(' / ');
    };

    const formatBrowser = userAgent => {
      if (!userAgent) {
        return '-';
      }
      const browser = new UAParser(userAgent).getBrowser();
      return [browser.name, browser.version].filter(Boolean).join(' ') || '-';
    };

    const formatEventDateTime = value => {
      if (!value) {
        return '-';
      }
      const date = dayjs(value);
      return date.isValid() ? date.format('YYYY-MM-DD HH:mm:ss') : '-';
    };

    const formatActualDuration = seconds => {
      const value = Number(seconds);
      if (!Number.isFinite(value) || value < 0) {
        return '-';
      }
      const hours = Math.floor(value / 3600);
      const minutes = Math.floor((value % 3600) / 60);
      const restSeconds = Math.floor(value % 60);
      return [hours ? `${hours}h` : null, minutes ? `${minutes}m` : null, `${restSeconds}s`].filter(Boolean).join(' ');
    };

    const createLineChartOption = ({ labels, series, yAxisName }) => {
      return {
        color: Object.values(defaultColors),
        tooltip: { trigger: 'axis', confine: true },
        legend: { type: 'scroll', left: 'center', bottom: 0, width: '88%' },
        grid: { left: 48, right: 32, top: 56, bottom: 72, containLabel: true },
        xAxis: { type: 'category', data: labels, axisLabel: { hideOverlap: true } },
        yAxis: {
          type: 'value',
          name: yAxisName,
          nameLocation: 'end',
          nameGap: 16,
          axisLabel: { margin: 12 }
        },
        series: series.map(item =>
          Object.assign(
            { type: 'line', smooth: true, connectNulls: true, showSymbol: false, lineStyle: { width: 1 } },
            {
              name: formatSeriesName(item.key),
              data: item.data
            }
          )
        )
      };
    };

    const liveEndTime = useMemo(() => {
      if (!overview.useLiveEnd || !overview.actualStart) {
        return overview.actualEnd;
      }
      return new Date(now).toISOString();
    }, [overview.useLiveEnd, overview.actualStart, overview.actualEnd, now]);

    const liveDurationSeconds = useMemo(() => {
      if (!overview.useLiveEnd || !overview.actualStart) {
        return overview.actualDurationSeconds;
      }
      const start = dayjs(overview.actualStart).valueOf();
      if (!Number.isFinite(start)) {
        return overview.actualDurationSeconds;
      }
      return Math.round((now - start) / 1000);
    }, [overview.useLiveEnd, overview.actualStart, overview.actualDurationSeconds, now]);

    useEffect(() => {
      if (!overview.useLiveEnd) {
        return;
      }
      const timer = window.setInterval(() => {
        setNow(Date.now());
      }, 1000);
      return () => window.clearInterval(timer);
    }, [overview.useLiveEnd]);

    const memberTabs = useMemo(() => {
      const memberIds = new Set(members.map(member => String(member.id)));
      const fromMembers = members.map(member => ({
        key: String(member.id),
        label: getMemberName(member)
      }));
      const extras = memberSummaries
        .filter(item => !memberIds.has(String(item.userId)))
        .map(item => ({
          key: String(item.userId),
          label: getUserNameById(item.userId)
        }));
      return fromMembers.concat(extras);
    }, [members, memberSummaries]);

    useEffect(() => {
      if (memberTabs.length === 0) {
        setActiveMemberKey(null);
        return;
      }
      if (!activeMemberKey || !memberTabs.some(item => item.key === activeMemberKey)) {
        setActiveMemberKey(memberTabs[0].key);
      }
    }, [memberTabs, activeMemberKey]);

    const activeMemberSummary = memberSummaries.find(item => String(item.userId) === String(activeMemberKey));

    const renderDeviceDescription = deviceInfo => {
      if (!deviceInfo) {
        return <Empty description={formatMessage({ id: 'NoDeviceInfo' })} />;
      }
      return (
        <div className={style['event-device-card']}>
          <Descriptions
            bordered
            size="small"
            column={{ xs: 1, sm: 1, md: 2 }}
            title={`${getUserNameById(activeMemberKey)} - ${formatEventDateTime(deviceInfo.time)}`}
            items={[
              { key: 'browser', label: formatMessage({ id: 'Browser' }), children: formatBrowser(deviceInfo.userAgent) },
              { key: 'platform', label: formatMessage({ id: 'Platform' }), children: deviceInfo.platform || '-' },
              { key: 'userAgent', label: formatMessage({ id: 'UserAgent' }), children: deviceInfo.userAgent || '-', span: 2 },
              { key: 'language', label: formatMessage({ id: 'Language' }), children: deviceInfo.language || '-' },
              {
                key: 'screen',
                label: formatMessage({ id: 'Screen' }),
                children:
                  deviceInfo.screenWidth && deviceInfo.screenHeight ? `${deviceInfo.screenWidth} * ${deviceInfo.screenHeight}` : '-'
              },
              { key: 'devicePixelRatio', label: formatMessage({ id: 'DevicePixelRatio' }), children: deviceInfo.devicePixelRatio || '-' },
              { key: 'connection', label: formatMessage({ id: 'NetworkConnection' }), children: formatConnection(deviceInfo.connection), span: 2 },
              { key: 'audioDeviceId', label: formatMessage({ id: 'SelectedAudioDevice' }), children: deviceInfo.selectedAudioLabel || '-' },
              { key: 'videoDeviceId', label: formatMessage({ id: 'SelectedVideoDevice' }), children: deviceInfo.selectedVideoLabel || '-' },
              {
                key: 'audioDevices',
                label: formatMessage({ id: 'AudioDeviceList' }),
                children:
                  deviceInfo.audioDeviceLabels?.length > 0
                    ? deviceInfo.audioDeviceLabels.map((label, index) => <div key={`${label}-${index}`}>{label}</div>)
                    : '-',
                span: 2
              },
              {
                key: 'videoDevices',
                label: formatMessage({ id: 'VideoDeviceList' }),
                children:
                  deviceInfo.videoDeviceLabels?.length > 0
                    ? deviceInfo.videoDeviceLabels.map((label, index) => <div key={`${label}-${index}`}>{label}</div>)
                    : '-',
                span: 2
              }
            ]}
          />
        </div>
      );
    };

    const renderStatisticsAnalysis = analysis => {
      if (!analysis) {
        return null;
      }
      const message = (analysis.issueCodes || [])
        .map(code => formatMessage({ id: code }))
        .join('；');
      return (
        <div className={style['event-analysis-list']}>
          <div className={style['event-chart-title']}>{formatMessage({ id: 'QualityAnalysis' })}</div>
          <Alert
            type={analysis.type}
            showIcon
            message={`${getUserNameById(activeMemberKey)}: ${message || formatMessage({ id: 'QualityNormalAnalysis' })}`}
            description={(analysis.metrics || []).map(formatAnalysisMetric).join(' / ')}
          />
        </div>
      );
    };

    const renderCharts = charts => {
      if (!charts) {
        return null;
      }
      const networkQualityChart =
        charts.networkQuality &&
        createLineChartOption({
          labels: charts.networkQuality.labels,
          series: charts.networkQuality.series,
          yAxisName: formatMessage({ id: 'QualityLevel' })
        });
      const statisticsNetwork =
        charts.statisticsNetwork &&
        createLineChartOption({
          labels: charts.statisticsNetwork.labels,
          series: charts.statisticsNetwork.series,
          yAxisName: formatMessage({ id: 'MetricValue' })
        });
      const statisticsMedia =
        charts.statisticsMedia &&
        createLineChartOption({
          labels: charts.statisticsMedia.labels,
          series: charts.statisticsMedia.series,
          yAxisName: formatMessage({ id: 'MetricValue' })
        });
      const callMetricChart =
        charts.callMetric &&
        createLineChartOption({
          labels: charts.callMetric.labels,
          series: charts.callMetric.series,
          yAxisName: formatMessage({ id: 'MetricValue' })
        });
      if (!(networkQualityChart || statisticsNetwork || statisticsMedia || callMetricChart)) {
        return null;
      }
      return (
        <div className={style['event-chart-list']}>
          {networkQualityChart && (
            <div className={style['event-chart-card']}>
              <div className={style['event-chart-title']}>{formatMessage({ id: 'NetworkQualityChart' })}</div>
              <Echart style={{ height: 260 }} option={networkQualityChart} />
            </div>
          )}
          {statisticsNetwork && (
            <div className={style['event-chart-card']}>
              <div className={style['event-chart-title']}>{formatMessage({ id: 'CallNetworkStatisticsChart' })}</div>
              <Echart style={{ height: 280 }} option={statisticsNetwork} />
            </div>
          )}
          {statisticsMedia && (
            <div className={style['event-chart-card']}>
              <div className={style['event-chart-title']}>{formatMessage({ id: 'CallMediaStatisticsChart' })}</div>
              <Echart style={{ height: 280 }} option={statisticsMedia} />
            </div>
          )}
          {callMetricChart && (
            <div className={style['event-chart-card']}>
              <div className={style['event-chart-title']}>{formatMessage({ id: 'CallMetricChart' })}</div>
              <Echart style={{ height: 300 }} option={callMetricChart} />
            </div>
          )}
        </div>
      );
    };

    const renderTimeline = timeline => {
      if (!(timeline && timeline.length > 0)) {
        return null;
      }
      return (
        <div className={style['event-timeline']}>
          <div className={style['event-chart-title']}>{formatMessage({ id: 'EventTimeline' })}</div>
          <Flow
            current={timeline.length - 1}
            dataSource={timeline}
            className={style['event-flow']}
            columns={[
              {
                type: 'title',
                name: 'code',
                getValueOf: item => `${getUserNameById(item.actorUserId)} - ${formatEventType(item.code)}`
              },
              {
                type: 'subTitle',
                name: 'time',
                format: 'datetime'
              }
            ]}
          />
        </div>
      );
    };

    const renderMemberInfo = memberSummary => {
      if (!memberSummary) {
        return <Empty description={formatMessage({ id: 'NoMemberEventInfo' })} />;
      }
      const hasMemberData =
        memberSummary.deviceInfo ||
        memberSummary.analysis ||
        memberSummary.charts?.networkQuality ||
        memberSummary.charts?.statisticsNetwork ||
        memberSummary.charts?.statisticsMedia ||
        memberSummary.charts?.callMetric ||
        (memberSummary.timeline || []).length > 0;
      if (!hasMemberData) {
        return <Empty description={formatMessage({ id: 'NoMemberEventInfo' })} />;
      }
      return (
        <Flex vertical gap={12}>
          {renderDeviceDescription(memberSummary.deviceInfo)}
          {renderStatisticsAnalysis(memberSummary.analysis)}
          {renderCharts(memberSummary.charts)}
          {renderTimeline(memberSummary.timeline)}
        </Flex>
      );
    };

    const renderRoomEventsOverview = () => {
      return (
        <div className={style['event-overview']}>
          <Flex justify="space-between" align="flex-start" gap={12} wrap>
            <div>
              <div className={style['event-overview-title']}>{name || formatMessage({ id: 'TrtcRoomEvents' })}</div>
              <div className={style['event-overview-id']}>ID: {id || '-'}</div>
            </div>
          </Flex>
          <Descriptions
            className={style['event-overview-descriptions']}
            size="small"
            column={{ xs: 1, sm: 3 }}
            items={[
              {
                key: 'actualStart',
                label: formatMessage({ id: 'RoomActualStartTime' }),
                children: formatEventDateTime(overview.actualStart)
              },
              {
                key: 'actualEnd',
                label: formatMessage({ id: 'RoomActualEndTime' }),
                children: formatEventDateTime(liveEndTime)
              },
              {
                key: 'actualDuration',
                label: formatMessage({ id: 'RoomActualDuration' }),
                children: formatActualDuration(liveDurationSeconds)
              }
            ]}
          />
        </div>
      );
    };

    const renderRoomEventsSummary = () => {
      const items = [
        {
          key: 'member',
          icon: <UserOutlined />,
          label: formatMessage({ id: 'RoomSummaryMemberCount' }),
          value: summary.memberCount ?? 0,
          status: 'default'
        },
        {
          key: 'online',
          icon: <UserOutlined />,
          label: formatMessage({ id: 'RoomSummaryOnlineCount' }),
          value: summary.onlineCount ?? 0,
          status: 'success'
        },
        {
          key: 'network',
          icon: <WifiOutlined />,
          label: formatMessage({ id: 'RoomSummaryNetworkIssues' }),
          value: summary.networkIssueCount ?? 0,
          status: summary.networkIssueCount ? 'error' : 'success'
        },
        {
          key: 'device',
          icon: <DesktopOutlined />,
          label: formatMessage({ id: 'RoomSummaryDeviceIssues' }),
          value: summary.deviceIssueCount ?? 0,
          status: summary.deviceIssueCount ? 'warning' : 'success'
        }
      ];
      return (
        <div className={style['event-summary-grid']}>
          {items.map(item => (
            <div className={classnames(style['event-summary-item'], style[`is-${item.status}`])} key={item.key}>
              <span className={style['event-summary-icon']}>{item.icon}</span>
              <span className={style['event-summary-content']}>
                <span className={style['event-summary-label']}>{item.label}</span>
                <span className={style['event-summary-value']}>{item.value}</span>
              </span>
            </div>
          ))}
        </div>
      );
    };

    const hasContent =
      overview.actualStart ||
      summary.memberCount > 0 ||
      memberSummaries.some(
        item =>
          item.deviceInfo ||
          item.analysis ||
          item.charts?.networkQuality ||
          item.charts?.statisticsNetwork ||
          item.charts?.statisticsMedia ||
          item.charts?.callMetric ||
          (item.timeline || []).length > 0
      );

    if (!data || !hasContent) {
      return (
        <div className={classnames(className, style['room-events'])}>
          <Empty description={formatMessage({ id: 'NoTrtcRoomEvents' })} />
        </div>
      );
    }

    return (
      <div className={classnames(className, style['room-events'])}>
        <Flex vertical gap={16}>
          {renderRoomEventsOverview()}
          {renderRoomEventsSummary()}
          {memberTabs.length > 0 && (
            <div className={style['event-device-info']}>
              <div className={style['event-chart-title']}>{formatMessage({ id: 'MemberEventInfo' })}</div>
              <Tabs
                className={style['event-device-tabs']}
                size="small"
                activeKey={activeMemberKey || undefined}
                onChange={setActiveMemberKey}
                items={memberTabs.map(item => ({
                  key: item.key,
                  label: item.label,
                  children: String(item.key) === String(activeMemberKey) ? renderMemberInfo(activeMemberSummary) : null
                }))}
              />
            </div>
          )}
        </Flex>
      </div>
    );
  })
);

export default RoomEvents;
