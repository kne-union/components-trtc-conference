import { createWithRemoteLoader } from '@kne/remote-loader';
import { useMemo } from 'react';
import { Flex, Card, Divider, Button, Alert, App, Empty, Descriptions, Tabs } from 'antd';
import dayjs from 'dayjs';
import classnames from 'classnames';
import style from './style.module.scss';
import SaveMember from './SaveMember';
import InviteMember from './InviteMember';
import JoinConference from './JoinConference';
import formatConferenceTime from './formatConferenceTime';
import ConferenceCountDown from './ConferenceCountDown';
import get from 'lodash/get';
import ConferenceDocument from '@components/ConferenceDocument';
import DeviceTesting from '@components/DeviceTesting';
import withLocale from './withLocale';
import { useIntl } from '@kne/react-intl';
import { defaultColors } from '@kne/react-box';
import { UAParser } from 'ua-parser-js';

export const ConferenceDetailInner = createWithRemoteLoader({
  modules: [
    'components-core:Icon',
    'components-core:Image',
    'components-core:InfoPage',
    'components-core:InfoPage@Flow',
    'components-core:StateTag',
    'components-core:ConfirmButton',
    'components-core:Global@usePreset',
    'components-core:LoadingButton',
    'components-core:FilePreview',
    'components-core:Common@SimpleBar',
    'components-core:Modal@useModal',
    'components-thirdparty:Echart',
    'components-admin:Account@Language'
  ]
})(withLocale(({
  remoteModules,
  id,
  current,
  inviter,
  startTime,
  duration,
  name,
  status,
  isInvitationAllowed,
  maxCount,
  members = [],
  options,
  apis,
  onReload,
  onEnter,
  onDetailEnter,
  onDetailLinkCopy,
  onEdit,
  onCancel,
  onBack,
  isAdmin,
  aiTranscriptionContent
}) => {
  const [Icon, Image, InfoPage, Flow, StateTag, ConfirmButton, usePreset, LoadingButton, FilePreview, SimpleBar, useModal, Echart, Language] = remoteModules;
  const { ajax } = usePreset();
  const { message } = App.useApp();
  const modal = useModal();
  const { formatMessage } = useIntl();
  const isBeforeStart = status === 0 && startTime && dayjs().isBefore(dayjs(startTime));
  const canViewTrtcRoomEvents = isAdmin || current?.isMaster;
  const transcriptionItems = useMemo(() => {
    const items = [];
    (aiTranscriptionContent?.content || []).forEach((item, index) => {
      items.push(Object.assign({}, item, { key: `content-${item.member?.id || item.sender || 'message'}-${index}` }));
    });
    (aiTranscriptionContent?.rounds || []).forEach((round, index) => {
      items.push({
        key: `round-${round.roundId || round.userId || index}`,
        member: { nickname: round.userId },
        message: round.text,
        time: round.startTime
      });
    });
    if (items.length === 0 && aiTranscriptionContent?.text) {
      items.push({
        key: 'text-summary',
        message: aiTranscriptionContent.text
      });
    }
    return items;
  }, [aiTranscriptionContent]);
  const renderMemberActions = member => {
    if (isAdmin) {
      return (
        status === 0 && (
          <Flex gap={8} wrap className={style['member-actions-inner']}>
            <LoadingButton
              type="link"
              className="btn-no-padding"
              onClick={() => {
                return onDetailEnter(member);
              }}
            >
              {formatMessage({ id: 'Enter' })}
            </LoadingButton>
            <LoadingButton
              type="link"
              className="btn-no-padding"
              onClick={() => {
                return onDetailLinkCopy(member);
              }}
            >
              {formatMessage({ id: 'CopyLink' })}
            </LoadingButton>
          </Flex>
        )
      );
    }
    return (
      status === 0 &&
      !member?.isMaster &&
      current?.isMaster && (
        <ConfirmButton
          danger
          size="small"
          type="text"
          icon={<Icon type="icon-shanchu" />}
          onClick={async () => {
            const { data: resData } = await ajax(
              Object.assign({}, apis.removeMember, {
                data: { id: member.id }
              })
            );
            if (resData.code !== 0) {
              return;
            }
            message.success(formatMessage({ id: 'DeleteSuccess' }));
            onReload && onReload();
          }}
        >
          {formatMessage({ id: 'Delete' })}
        </ConfirmButton>
      )
    );
  };
  const getMemberRecordFiles = memberId => {
    return get(options, `recordFiles.${memberId}`) || [];
  };
  const renderRecordFile = ({ fileId }) => {
    if (get(options, 'setting.record') === 'audio') {
      return (
        <FilePreview id={fileId}>
          {({ url }) => <audio controls src={url} className={style['preview-audio']} />}
        </FilePreview>
      );
    }
    return <FilePreview id={fileId} className={style['preview-file']} />;
  };
  const getMemberName = member => {
    return member?.nickname || member?.email || formatMessage({ id: 'DefaultUser' });
  };
  const getUserNameById = userId => {
    const member = members.find(item => String(item.id) === String(userId));
    if (member) {
      return getMemberName(member);
    }
    return userId === '-' ? formatMessage({ id: 'DefaultUser' }) : userId;
  };
  const getEventReporterId = event => {
    const payload = event.payload || {};
    return payload.reporterId || payload.event?.reporterId || payload.userId || payload.peerId || payload.event?.UserId || '-';
  };
  const getEventReporterName = event => {
    return getUserNameById(getEventReporterId(event));
  };
  const getEventActorId = event => {
    const payload = event.payload || {};
    return payload.event?.userId || payload.event?.data?.userId || payload.peerId || payload.event?.UserId || payload.userId || '-';
  };
  const getEventActorName = event => {
    return getUserNameById(getEventActorId(event));
  };
  const getMetricValue = (target, paths) => {
    for (const path of paths) {
      const value = get(target, path);
      if (value !== undefined && value !== null && value !== '') {
        return value;
      }
    }
    return undefined;
  };
  const toNumber = value => {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : undefined;
  };
  const formatIntegerMetric = value => {
    const numberValue = toNumber(value);
    return numberValue === undefined ? undefined : Math.round(numberValue);
  };
  const formatAudioLevelMetric = value => {
    const numberValue = toNumber(value);
    return numberValue === undefined ? undefined : Number((numberValue * 100).toFixed(2));
  };
  const getEventData = event => {
    const payload = event.payload || {};
    return payload.event?.data || payload.data || {};
  };
  const isDeviceInfoEvent = event => event.code === 'Client.device-info';
  const isChartEvent = event => ['Client.network-quality', 'Client.statistics', 'DescribeCallDetailInfo.Metric'].includes(event.code);
  const formatDeviceName = device => {
    if (!device) {
      return '-';
    }
    return device.label || device.deviceId || '-';
  };
  const formatDeviceList = devices => {
    if (!(Array.isArray(devices) && devices.length > 0)) {
      return '-';
    }
    return devices.map((device, index) => <div key={device.deviceId || index}>{formatDeviceName(device)}</div>);
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
  const getDeviceInfoMap = events => {
    const deviceEvents = events.filter(isDeviceInfoEvent);
    const eventMap = new Map();
    deviceEvents.forEach(event => {
      eventMap.set(String(getEventReporterId(event)), event);
    });
    return eventMap;
  };
  const renderDeviceDescription = event => {
    if (!event) {
      return <Empty description={formatMessage({ id: 'NoDeviceInfo' })} />;
    }
    const data = getEventData(event);
    const audioDevices = data.audioDevices || [];
    const videoDevices = data.videoDevices || [];
    const selectedAudio = audioDevices.find(device => device.deviceId === data.audioDeviceId);
    const selectedVideo = videoDevices.find(device => device.deviceId === data.videoDeviceId);
    return (
      <div className={style['event-device-card']}>
        <Descriptions
          bordered
          size="small"
          column={{ xs: 1, sm: 1, md: 2 }}
          title={`${getEventReporterName(event)} - ${dayjs(event.time).format('YYYY-MM-DD HH:mm:ss')}`}
          items={[
            { key: 'browser', label: formatMessage({ id: 'Browser' }), children: formatBrowser(data.userAgent) },
            { key: 'platform', label: formatMessage({ id: 'Platform' }), children: data.platform || '-' },
            { key: 'language', label: formatMessage({ id: 'Language' }), children: data.language || '-' },
            { key: 'userAgent', label: formatMessage({ id: 'UserAgent' }), children: data.userAgent || '-', span: 2 },
            {
              key: 'screen',
              label: formatMessage({ id: 'Screen' }),
              children: data.screenWidth && data.screenHeight ? `${data.screenWidth} * ${data.screenHeight}` : '-'
            },
            { key: 'devicePixelRatio', label: formatMessage({ id: 'DevicePixelRatio' }), children: data.devicePixelRatio || '-' },
            { key: 'connection', label: formatMessage({ id: 'NetworkConnection' }), children: formatConnection(data.connection), span: 2 },
            { key: 'audioDeviceId', label: formatMessage({ id: 'SelectedAudioDevice' }), children: formatDeviceName(selectedAudio) },
            { key: 'videoDeviceId', label: formatMessage({ id: 'SelectedVideoDevice' }), children: formatDeviceName(selectedVideo) },
            { key: 'audioDevices', label: formatMessage({ id: 'AudioDeviceList' }), children: formatDeviceList(audioDevices), span: 2 },
            { key: 'videoDevices', label: formatMessage({ id: 'VideoDeviceList' }), children: formatDeviceList(videoDevices), span: 2 }
          ]}
        />
      </div>
    );
  };
  const renderStatisticsAnalysis = statisticsAnalysis => {
    if (statisticsAnalysis.length === 0) {
      return null;
    }
    return (
      <div className={style['event-analysis-list']}>
        <div className={style['event-chart-title']}>{formatMessage({ id: 'QualityAnalysis' })}</div>
        {statisticsAnalysis.map(item => (
          <Alert
            key={item.userId}
            type={item.type}
            showIcon
            message={`${item.userName}: ${item.summary}`}
            description={item.metrics.join(' / ')}
          />
        ))}
      </div>
    );
  };
  const renderCharts = ({ networkQualityChart, statisticsCharts, callMetricChart }) => {
    if (!(networkQualityChart || statisticsCharts || callMetricChart)) {
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
        {statisticsCharts?.network && (
          <div className={style['event-chart-card']}>
            <div className={style['event-chart-title']}>{formatMessage({ id: 'CallNetworkStatisticsChart' })}</div>
            <Echart style={{ height: 280 }} option={statisticsCharts.network} />
          </div>
        )}
        {statisticsCharts?.media && (
          <div className={style['event-chart-card']}>
            <div className={style['event-chart-title']}>{formatMessage({ id: 'CallMediaStatisticsChart' })}</div>
            <Echart style={{ height: 280 }} option={statisticsCharts.media} />
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
  const isTimelineEvent = event => !isChartEvent(event) && !isDeviceInfoEvent(event);
  const renderTimeline = timelineEvents => {
    if (timelineEvents.length === 0) {
      return null;
    }
    return (
      <div className={style['event-timeline']}>
        <div className={style['event-chart-title']}>{formatMessage({ id: 'EventTimeline' })}</div>
        <Flow
          current={timelineEvents.length - 1}
          dataSource={timelineEvents}
          className={style['event-flow']}
          columns={[
            {
              type: 'title',
              name: 'code',
              getValueOf: event => `${getEventActorName(event)} - ${formatEventType(event)}`
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
  const renderMemberInfo = ({ userId, deviceInfoMap, events }) => {
    const memberEvents = events.filter(event => String(getEventReporterId(event)) === String(userId));
    const timelineEvents = memberEvents.filter(isTimelineEvent);
    const statisticsAnalysis = getStatisticsAnalysis(memberEvents);
    const networkQualityChart = getNetworkQualityChart(memberEvents);
    const statisticsCharts = getStatisticsCharts(memberEvents);
    const callMetricChart = getCallMetricChart(memberEvents);
    const hasMemberData = deviceInfoMap.has(String(userId)) || statisticsAnalysis.length > 0 || networkQualityChart || statisticsCharts || callMetricChart || timelineEvents.length > 0;
    if (!hasMemberData) {
      return <Empty description={formatMessage({ id: 'NoMemberEventInfo' })} />;
    }
    return (
      <Flex vertical gap={12}>
        {renderDeviceDescription(deviceInfoMap.get(String(userId)))}
        {renderStatisticsAnalysis(statisticsAnalysis)}
        {renderCharts({ networkQualityChart, statisticsCharts, callMetricChart })}
        {renderTimeline(timelineEvents)}
      </Flex>
    );
  };
  const renderMemberInfoTabs = ({ events, deviceInfoMap }) => {
    const memberTabs = members.map(member => ({
      key: String(member.id),
      label: getMemberName(member),
      children: renderMemberInfo({ userId: member.id, deviceInfoMap, events })
    }));
    const memberIds = new Set(members.map(member => String(member.id)));
    const eventUserIds = Array.from(new Set(events.map(event => String(getEventReporterId(event)))));
    const extraTabs = eventUserIds
      .filter(userId => !memberIds.has(String(userId)))
      .map(userId => {
        const event = events.find(event => String(getEventReporterId(event)) === String(userId));
        return {
          key: String(userId),
          label: getEventReporterName(event),
          children: renderMemberInfo({ userId, deviceInfoMap, events })
        };
      });
    const items = memberTabs.concat(extraTabs);
    if (items.length === 0) {
      return null;
    }
    return (
      <div className={style['event-device-info']}>
        <div className={style['event-chart-title']}>{formatMessage({ id: 'MemberEventInfo' })}</div>
        <Tabs className={style['event-device-tabs']} size="small" items={items} />
      </div>
    );
  };
  const getTimeLabels = data => {
    return Array.from(new Set(data.map(event => dayjs(event.time).format('HH:mm:ss'))));
  };
  const createUserSeries = ({ data, labels, metrics }) => {
    const userIds = Array.from(new Set(data.map(getEventReporterId)));
    return userIds.flatMap(userId => {
      const userData = data.filter(event => String(getEventReporterId(event)) === String(userId));
      return metrics.map(metric => ({
        name: metric.name,
        data: labels.map(label => {
          const target = userData.find(event => dayjs(event.time).format('HH:mm:ss') === label);
          return target ? metric.getValue(target) : undefined;
        })
      }));
    });
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
      series: series.map(item => Object.assign({ type: 'line', smooth: true, connectNulls: true, showSymbol: false, lineStyle: { width: 1 } }, item))
    };
  };
  const getNetworkQualityChart = events => {
    const data = events.filter(event => event.code === 'Client.network-quality').sort((a, b) => dayjs(a.time).valueOf() - dayjs(b.time).valueOf());
    if (data.length === 0) {
      return null;
    }
    return createLineChartOption({
      labels: getTimeLabels(data),
      yAxisName: formatMessage({ id: 'QualityLevel' }),
      series: createUserSeries({
        data,
        labels: getTimeLabels(data),
        metrics: [
          { name: formatMessage({ id: 'UplinkNetworkQuality' }), getValue: event => formatIntegerMetric(getEventData(event).uplinkNetworkQuality) },
          { name: formatMessage({ id: 'DownlinkNetworkQuality' }), getValue: event => formatIntegerMetric(getEventData(event).downlinkNetworkQuality) }
        ]
      })
    });
  };
  const getStatisticsCharts = events => {
    const data = events.filter(event => event.code === 'Client.statistics').sort((a, b) => dayjs(a.time).valueOf() - dayjs(b.time).valueOf());
    if (data.length === 0) {
      return null;
    }
    const labels = getTimeLabels(data);
    return {
      network: createLineChartOption({
        labels,
        yAxisName: formatMessage({ id: 'MetricValue' }),
        series: createUserSeries({
          data,
          labels,
          metrics: [
            { name: 'RTT(ms)', getValue: event => formatIntegerMetric(getMetricValue(getEventData(event), ['rtt'])) },
            { name: formatMessage({ id: 'UpLoss' }), getValue: event => formatIntegerMetric(getMetricValue(getEventData(event), ['upLoss'])) },
            { name: formatMessage({ id: 'DownLoss' }), getValue: event => formatIntegerMetric(getMetricValue(getEventData(event), ['downLoss'])) }
          ]
        })
      }),
      media: createLineChartOption({
        labels,
        yAxisName: formatMessage({ id: 'MetricValue' }),
        series: createUserSeries({
          data,
          labels,
          metrics: [
            { name: formatMessage({ id: 'AudioBitrate' }), getValue: event => formatIntegerMetric(getMetricValue(getEventData(event), ['localStatistics.audio.bitrate'])) },
            { name: `${formatMessage({ id: 'AudioLevel' })}(%)`, getValue: event => formatAudioLevelMetric(getMetricValue(getEventData(event), ['localStatistics.audio.audioLevel'])) },
            { name: formatMessage({ id: 'VideoBitrate' }), getValue: event => formatIntegerMetric(getMetricValue(getEventData(event), ['localStatistics.video.0.bitrate'])) },
            { name: formatMessage({ id: 'FrameRate' }), getValue: event => formatIntegerMetric(getMetricValue(getEventData(event), ['localStatistics.video.0.frameRate'])) }
          ]
        })
      })
    };
  };
  const getCallMetricChart = events => {
    const metricEvents = events.filter(event => event.code === 'DescribeCallDetailInfo.Metric');
    const points = metricEvents.flatMap(event => {
      const payload = event.payload || {};
      const data = payload.data || {};
      return (data.Content || []).map(item => ({
        time: item.Time,
        value: formatIntegerMetric(item.Value),
        name: data.DataType || payload.dataType
      }));
    });
    if (points.length === 0) {
      return null;
    }
    const labels = Array.from(new Set(points.map(item => dayjs(item.time * 1000).format('HH:mm:ss')))).sort();
    const groupNames = Array.from(new Set(points.map(item => item.name)));
    return createLineChartOption({
      labels,
      yAxisName: formatMessage({ id: 'MetricValue' }),
      series: groupNames.map(name => ({
        name,
        data: labels.map(label => {
          const point = points.find(item => item.name === name && dayjs(item.time * 1000).format('HH:mm:ss') === label);
          return point?.value;
        })
      }))
    });
  };
  const average = values => {
    const list = values.map(toNumber).filter(value => typeof value === 'number' && Number.isFinite(value));
    if (list.length === 0) {
      return undefined;
    }
    return list.reduce((sum, value) => sum + value, 0) / list.length;
  };
  const getStatisticsAnalysis = events => {
    const data = events.filter(event => event.code === 'Client.statistics');
    const userIds = Array.from(new Set(data.map(getEventReporterId)));
    return userIds
      .map(userId => {
        const userEvents = data.filter(event => String(getEventReporterId(event)) === String(userId));
        const metrics = userEvents.map(getEventData);
        const avgRtt = average(metrics.map(item => getMetricValue(item, ['rtt'])));
        const maxRtt = Math.max(...metrics.map(item => toNumber(getMetricValue(item, ['rtt']))).filter(value => typeof value === 'number'));
        const avgLoss = average(metrics.map(item => (Number(getMetricValue(item, ['upLoss']) || 0) + Number(getMetricValue(item, ['downLoss']) || 0)) / 2));
        const avgFrameRate = average(metrics.map(item => getMetricValue(item, ['localStatistics.video.0.frameRate'])));
        const avgAudioLevel = average(metrics.map(item => getMetricValue(item, ['localStatistics.audio.audioLevel'])));
        const issues = [];
        let type = 'success';
        if ((avgRtt !== undefined && avgRtt > 150) || (maxRtt !== -Infinity && maxRtt > 300) || (avgLoss !== undefined && avgLoss > 5)) {
          type = 'error';
          issues.push(formatMessage({ id: 'NetworkBadAnalysis' }));
        } else if ((avgRtt !== undefined && avgRtt > 100) || (avgLoss !== undefined && avgLoss > 0)) {
          type = 'warning';
          issues.push(formatMessage({ id: 'NetworkWarningAnalysis' }));
        }
        if (avgFrameRate !== undefined && avgFrameRate < 15) {
          type = 'error';
          issues.push(formatMessage({ id: 'FrameRateBadAnalysis' }));
        } else if (avgFrameRate !== undefined && avgFrameRate < 20 && type !== 'error') {
          type = 'warning';
          issues.push(formatMessage({ id: 'FrameRateWarningAnalysis' }));
        }
        if (avgAudioLevel !== undefined && avgAudioLevel < 0.01) {
          if (type !== 'error') {
            type = 'warning';
          }
          issues.push(formatMessage({ id: 'AudioLevelLowAnalysis' }));
        } else if (avgAudioLevel !== undefined && avgAudioLevel > 0.2) {
          if (type !== 'error') {
            type = 'warning';
          }
          issues.push(formatMessage({ id: 'AudioLevelHighAnalysis' }));
        }
        return {
          userId,
          userName: getEventReporterName(userEvents[0]),
          type,
          summary: issues.length > 0 ? issues.join('；') : formatMessage({ id: 'QualityNormalAnalysis' }),
          metrics: [
            avgRtt !== undefined ? `RTT ${Math.round(avgRtt)}ms` : null,
            avgLoss !== undefined ? `${formatMessage({ id: 'PacketLoss' })} ${Math.round(avgLoss)}%` : null,
            avgFrameRate !== undefined ? `${formatMessage({ id: 'FrameRate' })} ${Math.round(avgFrameRate)}fps` : null,
            avgAudioLevel !== undefined ? `${formatMessage({ id: 'AudioLevel' })} ${(avgAudioLevel * 100).toFixed(2)}%` : null
          ].filter(Boolean)
        };
      })
      .filter(item => item.metrics.length > 0);
  };
  const formatEventType = event => {
    const payload = event.payload || {};
    const eventType = payload.eventType || payload.recordType || payload.eventId || event.code;
    const mapping = {
      'Client.enter': formatMessage({ id: 'EventEnterRoom' }),
      'Client.exit': formatMessage({ id: 'EventExitRoom' }),
      'Client.network-quality': formatMessage({ id: 'EventNetworkQuality' }),
      'Client.statistics': formatMessage({ id: 'EventStatistics' }),
      'Client.camera-open': formatMessage({ id: 'EventCameraOpen' }),
      'Client.camera-close': formatMessage({ id: 'EventCameraClose' }),
      'Client.microphone-open': formatMessage({ id: 'EventMicrophoneOpen' }),
      'Client.microphone-close': formatMessage({ id: 'EventMicrophoneClose' }),
      'Client.camera-switch': formatMessage({ id: 'EventCameraSwitch' }),
      'Client.microphone-switch': formatMessage({ id: 'EventMicrophoneSwitch' }),
      'Client.device-info': formatMessage({ id: 'EventDeviceInfo' }),
      'DescribeCallDetailInfo.User': formatMessage({ id: 'EventUserInfo' }),
      'DescribeCallDetailInfo.Metric': formatMessage({ id: 'EventCallMetric' }),
      '103': formatMessage({ id: 'EventRoomDismiss' }),
      enter: formatMessage({ id: 'EventEnterRoom' }),
      exit: formatMessage({ id: 'EventExitRoom' }),
      user: formatMessage({ id: 'EventUserInfo' }),
      metric: formatMessage({ id: 'EventCallMetric' })
    };
    return mapping[event.code] || mapping[String(eventType)] || `${formatMessage({ id: 'EventCode' })}: ${eventType || '-'}`;
  };
  const showTrtcRoomEvents = async () => {
    const { data: resData } = await ajax(
      Object.assign({}, apis?.getTrtcInstanceEvents, {
        params: { id, perPage: 200, currentPage: 1 }
      })
    );
    if (resData.code !== 0) {
      return;
    }
    const events = resData.data?.pageData || [];
    const sortedEvents = events.slice().sort((a, b) => dayjs(a.time).valueOf() - dayjs(b.time).valueOf());
    const deviceInfoMap = getDeviceInfoMap(sortedEvents);
    modal({
      title: formatMessage({ id: 'TrtcRoomEvents' }),
      footer: null,
      width: 860,
      children: (
        <SimpleBar className={style['event-modal-scroller']}>
          {events.length > 0 ? (
            <Flex vertical gap={16}>
              {renderMemberInfoTabs({ events: sortedEvents, deviceInfoMap })}
            </Flex>
          ) : (
            <Empty description={formatMessage({ id: 'NoTrtcRoomEvents' })} />
          )}
        </SimpleBar>
      )
    });
  };

  return (
    <Flex vertical flex={1} className={style['right-panel']}>
      <Flex className={style['title']} gap={8} justify="space-between">
        <Flex gap={8} className={style['title-info']}>
          {onBack && (
            <Button
              type="link"
              className="btn-no-padding"
              icon={<Icon type="icon-arrow-thin-left" />}
              style={{ gap: '0' }}
              onClick={() => {
                onBack();
              }}
            >
              {formatMessage({ id: 'Back' })}
            </Button>
          )}
        </Flex>
        <Flex gap={8} align="center" className={style['title-actions']}>
          <Language colorful={false} />
          {onCancel && isBeforeStart && (
            <ConfirmButton type="link" danger message={formatMessage({ id: 'CancelMeetingConfirm' })} okText={formatMessage({ id: 'CancelMeeting' })} onClick={onCancel}>
              {formatMessage({ id: 'CancelMeeting' })}
            </ConfirmButton>
          )}
          {onEdit && status === 0 && (
            <Button type="link" onClick={onEdit}>
              {formatMessage({ id: 'Edit' })}
            </Button>
          )}
        </Flex>
      </Flex>
      <Divider className={style['divider']} />
      <div className={style['detail-summary']}>
        <div className={style['detail-name']}>{name}</div>
        <div className={style['detail-time']}>({formatConferenceTime({ startTime, duration, formatMessage })})</div>
      </div>
      <SimpleBar className={style['scroller']}>
        <Flex vertical align="center" className={style['current-user']} gap={30}>
          {status === 0 && current && (
            <>
              <Card variant={'borderless'}>
                <Flex vertical gap={12} align="center">
                  <Image.Avatar size={100} id={current.avatar} />
                  <div>{current.nickname}</div>
                </Flex>
                <SaveMember
                  apis={apis}
                  data={current}
                  onSuccess={() => {
                    onReload && onReload();
                  }}
                >
                  {({ onClick }) => {
                    return (
                      <Button onClick={onClick} className={style['current-user-edit']} size="small" type="text" icon={<Icon type="icon-bianji" />} />
                    );
                  }}
                </SaveMember>
              </Card>
              {startTime && (
                <Flex gap={8}>
                  <Icon type="icon-shijian" />
                  <ConferenceCountDown
                    startTime={startTime}
                    duration={duration}
                    onComplete={() => {
                      onReload && onReload();
                    }}
                  />
                  {formatMessage({ id: 'StartMeeting' })}
                </Flex>
              )}
              <Flex gap={12} className={style['current-actions']}>
                {isInvitationAllowed && members.length < maxCount && current?.isMaster && (
                  <InviteMember size="large" shape="round" apis={apis}>
                    {formatMessage({ id: 'InviteMembers' })}({members.length}/{maxCount})
                  </InviteMember>
                )}
                <Button
                  size="large"
                  shape="round"
                  icon={<Icon type="icon-setting" fontClassName="iconfont-ai" />}
                  onClick={() => {
                    const modalApi = modal({
                      title: formatMessage({ id: 'DeviceTesting' }),
                      footer: null,
                      children: <DeviceTesting onComplete={() => {
                        message.success(formatMessage({ id: 'DeviceTestingComplete' }));
                        modalApi.close();
                      }} />
                    });
                  }}
                >
                  {formatMessage({ id: 'DeviceTesting' })}
                </Button>
                <Button
                  disabled={startTime && dayjs(startTime).isAfter(dayjs())}
                  size="large"
                  type="primary"
                  shape="round"
                  icon={<Icon type="icon-fasongduihua" />}
                  onClick={() => {
                    onEnter && onEnter();
                  }}
                >
                  {formatMessage({ id: 'EnterMeeting' })}
                </Button>
              </Flex>
            </>
          )}
          {status === 0 && inviter && (
            <>
              <div className={style['tips']}>{inviter.nickname}{formatMessage({ id: 'InviteYouToMeeting' })}</div>
              {isInvitationAllowed && members.length < maxCount ? (
                <>
                  <Flex gap={8}>
                    <Icon type="icon-shijian" />
                    <ConferenceCountDown
                      startTime={startTime}
                      onComplete={() => {
                        onReload && onReload();
                      }}
                    />
                    {formatMessage({ id: 'AfterStartMeeting' })}
                  </Flex>
                  <JoinConference
                    apis={apis}
                    onSuccess={data => {
                      onReload && onReload(data);
                    }}
                  >
                    {({ onClick }) => {
                      return (
                        <Button size="large" type="primary" shape="round" onClick={onClick}>
                          {formatMessage({ id: 'JoinMeeting' })}
                        </Button>
                      );
                    }}
                  </JoinConference>
                </>
              ) : (
                <Alert type="error" message={formatMessage({ id: 'CannotJoinMeeting' })} />
              )}
            </>
          )}
          {status === 1 && <div className={style['tips']}>{formatMessage({ id: 'MeetingEnded' })}</div>}
          {status === 2 && <div className={style['tips']}>{formatMessage({ id: 'MeetingCanceled' })}</div>}
          {[0, 1, 2].indexOf(status) === -1 && <div className={style['tips']}>{formatMessage({ id: 'MeetingError' })}</div>}
          {options?.documentType && (isAdmin || options?.documentVisibleAll || current?.isMaster) && (
            <Flex vertical className={style['member-area']}>
              <Flex align="center">
                <div className={style['member-title']}>{formatMessage({ id: 'MeetingDocument' })}</div>
                <LoadingButton
                  type="link"
                  onClick={() => {
                    modal({
                      title: formatMessage({ id: 'DocumentPreview' }),
                      footer: null,
                      children: (
                        <ConferenceDocument
                          type={options?.documentType}
                          moduleProps={Object.assign({}, options?.moduleProps, {
                            conferenceStep: 'waiting'
                          })}
                          files={options?.document}
                          module={options?.module}
                        />
                      )
                    });
                  }}
                >
                  {options?.documentTitle || formatMessage({ id: 'View' })}
                </LoadingButton>
              </Flex>
            </Flex>
          )}

          <Flex vertical className={style['member-area']}>
            <div className={style['member-title']}>
              {formatMessage({ id: 'Participants' })}({members.length}/{maxCount})
            </div>
            <div className={style['member-list']}>
              {members.length > 0 ? (
                members.map(member => (
                  <div className={style['member-item']} key={member.id || member.email || member.nickname}>
                    <Flex align="center" gap={10} className={style['member-info']}>
                      <Image.Avatar size={36} id={member.avatar} />
                      <div className={style['member-profile']}>
                        <div className={style['member-name']}>{member.nickname || member.email || '-'}</div>
                        <StateTag type={member.isMaster ? 'success' : undefined} text={member.isMaster ? formatMessage({ id: 'Host' }) : formatMessage({ id: 'Attendee' })} />
                      </div>
                    </Flex>
                    <div className={style['member-actions']}>{renderMemberActions(member)}</div>
                  </div>
                ))
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </div>
          </Flex>
          {status === 1 && apis?.getTrtcInstanceEvents && canViewTrtcRoomEvents && (
            <Flex vertical className={style['member-area']}>
              <Flex align="center" justify="space-between">
                <div className={style['member-title']}>{formatMessage({ id: 'TrtcRoomEvents' })}</div>
                <LoadingButton type="link" onClick={showTrtcRoomEvents}>
                  {formatMessage({ id: 'ViewTrtcRoomEvents' })}
                </LoadingButton>
              </Flex>
            </Flex>
          )}
          {isAdmin && status === 1 && get(options, 'setting.record') && (
            <Flex vertical className={style['member-area']}>
              <div className={style['member-title']}>{formatMessage({ id: 'Meeting' })}{get(options, 'setting.record') === 'video' ? formatMessage({ id: 'MeetingRecording' }) : formatMessage({ id: 'MeetingAudio' })}</div>
              <InfoPage className={style['preview-list']}>
                <InfoPage.Part>
                  {get(options, 'recordFilesAchieved') ? (
                    (members || [])
                      .sort((a, b) => {
                        return a.isMaster === b.isMaster ? 0 : a.isMaster ? -1 : 1;
                      })
                      .map(item => {
                        const list = getMemberRecordFiles(item.id);
                        return (
                          <InfoPage.Part title={`${getMemberName(item)}(${item.isMaster ? formatMessage({ id: 'Host' }) : formatMessage({ id: 'Attendee' })})`}>
                            <Flex gap={8} justify="center">
                              {list.length > 0 ? (
                                list.map(({ fileId }) => {
                                  return <div key={fileId}>{renderRecordFile({ fileId })}</div>;
                                })
                              ) : (
                                <Empty description={formatMessage({ id: 'NoRecordedResources' })} />
                              )}
                            </Flex>
                          </InfoPage.Part>
                        );
                      })
                  ) : (
                    <Empty description={formatMessage({ id: 'SyncingRecordedResources' })}>
                      <Button size="small" type="primary" onClick={onReload}>
                        {formatMessage({ id: 'Refresh' })}
                      </Button>
                    </Empty>
                  )}
                </InfoPage.Part>
              </InfoPage>
            </Flex>
          )}
          {isAdmin && status === 1 && get(options, 'setting.speech') && (
            <Flex vertical className={style['member-area']}>
              <div className={style['member-title']}>{formatMessage({ id: 'AiTranscriptionContent' })}</div>
              <div className={style['transcription-list']}>
                {transcriptionItems.length > 0 ? (
                  transcriptionItems.map(item => (
                    <div className={style['transcription-item']} key={item.key}>
                      <Flex justify="space-between" gap={12}>
                        <div className={style['transcription-member']}>{item.member?.nickname || item.sender || formatMessage({ id: 'DefaultUser' })}</div>
                        {item.time && <div className={style['transcription-time']}>{dayjs(item.time).format('HH:mm:ss')}</div>}
                      </Flex>
                      <div className={style['transcription-message']}>{item.message}</div>
                    </div>
                  ))
                ) : (
                  <Empty description={formatMessage({ id: 'NoAiTranscriptionContent' })} />
                )}
              </div>
            </Flex>
          )}
          {isAdmin && (
            <Flex justify="center">
              {isInvitationAllowed && status === 0 && (
                <InviteMember type="primary" size="large" shape="round" apis={apis} id={id} disabled={members.length >= maxCount}>
                  {formatMessage({ id: 'InviteMembers' })}({members.length}/{maxCount})
                </InviteMember>
              )}
            </Flex>
          )}
        </Flex>
      </SimpleBar>
    </Flex>
  );
}));

const ConferenceDetail = ({ className, ...props }) => {
  return (
    <Flex className={classnames(className, style['info'])} vertical>
      <div className={style['right-panel-outer']}>
        <ConferenceDetailInner {...props} />
      </div>
    </Flex>
  );
};

export default ConferenceDetail;
