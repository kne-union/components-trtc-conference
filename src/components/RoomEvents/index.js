import { createWithRemoteLoader } from '@kne/remote-loader';
import { Flex, Alert, Empty, Descriptions, Tabs } from 'antd';
import { DesktopOutlined, UserOutlined, WifiOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import classnames from 'classnames';
import get from 'lodash/get';
import { defaultColors } from '@kne/react-box';
import { UAParser } from 'ua-parser-js';
import { useIntl } from '@kne/react-intl';
import { useEffect, useState } from 'react';
import withLocale from './withLocale';
import style from './style.module.scss';

const RoomEvents = createWithRemoteLoader({
  modules: ['components-core:InfoPage@Flow', 'components-thirdparty:Echart']
})(
  withLocale(({ remoteModules, className, id, name, status, members = [], events = [] }) => {
    const [Flow, Echart] = remoteModules;
    const { formatMessage } = useIntl();
    const [now, setNow] = useState(() => Date.now());
    const sortedEvents = events.slice().sort((a, b) => dayjs(a.time).valueOf() - dayjs(b.time).valueOf());

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
    const getDeviceInfoMap = eventList => {
      const deviceEvents = eventList.filter(isDeviceInfoEvent);
      const eventMap = new Map();
      deviceEvents.forEach(event => {
        eventMap.set(String(getEventReporterId(event)), event);
      });
      return eventMap;
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
    const getNetworkQualityChart = eventList => {
      const data = eventList.filter(event => event.code === 'Client.network-quality').sort((a, b) => dayjs(a.time).valueOf() - dayjs(b.time).valueOf());
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
    const getStatisticsCharts = eventList => {
      const data = eventList.filter(event => event.code === 'Client.statistics').sort((a, b) => dayjs(a.time).valueOf() - dayjs(b.time).valueOf());
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
    const getCallMetricChart = eventList => {
      const metricEvents = eventList.filter(event => event.code === 'DescribeCallDetailInfo.Metric');
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
        series: groupNames.map(metricName => ({
          name: metricName,
          data: labels.map(label => {
            const point = points.find(item => item.name === metricName && dayjs(item.time * 1000).format('HH:mm:ss') === label);
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
    const getStatisticsAnalysis = eventList => {
      const data = eventList.filter(event => event.code === 'Client.statistics');
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
    const isEnterEvent = event => {
      const payload = event.payload || {};
      return (
        event.code === 'Client.enter' ||
        event.code === 'enter' ||
        event.code === '1001' ||
        payload.paramOne === 'enter' ||
        payload.event?.ParamOne === 'enter'
      );
    };
    const isExitEvent = event => {
      const payload = event.payload || {};
      return (
        event.code === 'Client.exit' ||
        event.code === 'exit' ||
        event.code === '1002' ||
        payload.paramOne === 'exit' ||
        payload.event?.ParamOne === 'exit'
      );
    };
    const isDismissEvent = event => {
      const payload = event.payload || {};
      return event.code === '103' || payload.eventType === 103 || payload.event?.EventId === 103;
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
    const getRoomActualTimeSummary = (eventList, currentTime = Date.now()) => {
      const enterTimes = eventList.filter(isEnterEvent).map(event => dayjs(event.time).valueOf()).filter(Number.isFinite);
      const actualStart = enterTimes.length > 0 ? Math.min(...enterTimes) : null;
      let onlineCount = 0;
      let roomEmptyAt = null;
      let dismissAt = null;
      eventList.forEach(event => {
        const timeValue = dayjs(event.time).valueOf();
        if (!Number.isFinite(timeValue)) {
          return;
        }
        if (isEnterEvent(event)) {
          onlineCount += 1;
        }
        if (isExitEvent(event)) {
          onlineCount = Math.max(0, onlineCount - 1);
          if (onlineCount === 0) {
            roomEmptyAt = timeValue;
          }
        }
        if (isDismissEvent(event)) {
          dismissAt = timeValue;
        }
      });
      let actualEnd = null;
      let useLiveEnd = false;
      if (roomEmptyAt != null || dismissAt != null) {
        actualEnd = Math.max(roomEmptyAt || 0, dismissAt || 0) || null;
      } else if (status === 1 && eventList.length > 0) {
        const lastEventTime = dayjs(eventList[eventList.length - 1].time).valueOf();
        actualEnd = Number.isFinite(lastEventTime) ? lastEventTime : null;
      } else if (status !== 1 && actualStart != null) {
        actualEnd = currentTime;
        useLiveEnd = true;
      }
      const actualDurationSeconds =
        actualStart != null && actualEnd != null && actualEnd >= actualStart ? Math.round((actualEnd - actualStart) / 1000) : null;
      return {
        actualStart,
        actualEnd,
        actualDurationSeconds,
        useLiveEnd
      };
    };
    const getMemberEventState = (userId, eventList) => {
      const userEvents = eventList.filter(event => String(getEventReporterId(event)) === String(userId));
      let online = false;
      let cameraOpen = null;
      let microphoneOpen = null;
      let worstNetwork = 0;
      userEvents.forEach(event => {
        if (event.code === 'Client.enter' || event.code === 'enter') {
          online = true;
        }
        if (event.code === 'Client.exit' || event.code === 'exit') {
          online = false;
        }
        if (event.code === 'Client.camera-open') {
          cameraOpen = true;
        }
        if (event.code === 'Client.camera-close') {
          cameraOpen = false;
        }
        if (event.code === 'Client.microphone-open') {
          microphoneOpen = true;
        }
        if (event.code === 'Client.microphone-close') {
          microphoneOpen = false;
        }
        if (event.code === 'Client.network-quality') {
          const data = getEventData(event);
          const quality = Math.max(Number(data.uplinkNetworkQuality) || 0, Number(data.downlinkNetworkQuality) || 0);
          if (quality > worstNetwork) {
            worstNetwork = quality;
          }
        }
      });
      return { online, cameraOpen, microphoneOpen, worstNetwork };
    };
    const getRoomEventsSummary = eventList => {
      const memberIds = members.map(member => String(member.id)).filter(Boolean);
      const eventUserIds = Array.from(new Set(eventList.map(event => String(getEventReporterId(event))).filter(userId => userId && userId !== '-')));
      const userIds = Array.from(new Set(memberIds.concat(eventUserIds)));
      const networkIssueUserIds = new Set(
        getStatisticsAnalysis(eventList)
          .filter(item => item.type === 'error')
          .map(item => String(item.userId))
      );
      let onlineCount = 0;
      let networkIssueCount = 0;
      let deviceIssueCount = 0;
      userIds.forEach(userId => {
        const memberState = getMemberEventState(userId, eventList);
        if (memberState.online) {
          onlineCount += 1;
        }
        if (memberState.worstNetwork >= 4 || networkIssueUserIds.has(String(userId))) {
          networkIssueCount += 1;
        }
        if (memberState.cameraOpen === false || memberState.microphoneOpen === false) {
          deviceIssueCount += 1;
        }
      });
      return {
        memberCount: members.length || userIds.length,
        onlineCount,
        networkIssueCount,
        deviceIssueCount
      };
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
              { key: 'userAgent', label: formatMessage({ id: 'UserAgent' }), children: data.userAgent || '-', span: 2 },
              { key: 'language', label: formatMessage({ id: 'Language' }), children: data.language || '-' },
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
    const renderMemberInfo = ({ userId, deviceInfoMap, eventList }) => {
      const memberEvents = eventList.filter(event => String(getEventReporterId(event)) === String(userId));
      const timelineEvents = memberEvents.filter(isTimelineEvent);
      const statisticsAnalysis = getStatisticsAnalysis(memberEvents);
      const networkQualityChart = getNetworkQualityChart(memberEvents);
      const statisticsCharts = getStatisticsCharts(memberEvents);
      const callMetricChart = getCallMetricChart(memberEvents);
      const hasMemberData =
        deviceInfoMap.has(String(userId)) || statisticsAnalysis.length > 0 || networkQualityChart || statisticsCharts || callMetricChart || timelineEvents.length > 0;
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
    const renderMemberInfoTabs = ({ eventList, deviceInfoMap }) => {
      const memberTabs = members.map(member => ({
        key: String(member.id),
        label: getMemberName(member),
        children: renderMemberInfo({ userId: member.id, deviceInfoMap, eventList })
      }));
      const memberIds = new Set(members.map(member => String(member.id)));
      const eventUserIds = Array.from(new Set(eventList.map(event => String(getEventReporterId(event)))));
      const extraTabs = eventUserIds
        .filter(userId => !memberIds.has(String(userId)))
        .map(userId => {
          const event = eventList.find(item => String(getEventReporterId(item)) === String(userId));
          return {
            key: String(userId),
            label: getEventReporterName(event),
            children: renderMemberInfo({ userId, deviceInfoMap, eventList })
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
    const renderRoomEventsOverview = timeSummary => {
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
                children: formatEventDateTime(timeSummary.actualStart)
              },
              {
                key: 'actualEnd',
                label: formatMessage({ id: 'RoomActualEndTime' }),
                children: formatEventDateTime(timeSummary.actualEnd)
              },
              {
                key: 'actualDuration',
                label: formatMessage({ id: 'RoomActualDuration' }),
                children: formatActualDuration(timeSummary.actualDurationSeconds)
              }
            ]}
          />
        </div>
      );
    };
    const renderRoomEventsSummary = summary => {
      const items = [
        {
          key: 'member',
          icon: <UserOutlined />,
          label: formatMessage({ id: 'RoomSummaryMemberCount' }),
          value: summary.memberCount,
          status: 'default'
        },
        {
          key: 'online',
          icon: <UserOutlined />,
          label: formatMessage({ id: 'RoomSummaryOnlineCount' }),
          value: summary.onlineCount,
          status: 'success'
        },
        {
          key: 'network',
          icon: <WifiOutlined />,
          label: formatMessage({ id: 'RoomSummaryNetworkIssues' }),
          value: summary.networkIssueCount,
          status: summary.networkIssueCount ? 'error' : 'success'
        },
        {
          key: 'device',
          icon: <DesktopOutlined />,
          label: formatMessage({ id: 'RoomSummaryDeviceIssues' }),
          value: summary.deviceIssueCount,
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

    const timeSummary = getRoomActualTimeSummary(sortedEvents, now);

    useEffect(() => {
      if (!timeSummary.useLiveEnd) {
        return;
      }
      const timer = window.setInterval(() => {
        setNow(Date.now());
      }, 1000);
      return () => window.clearInterval(timer);
    }, [timeSummary.useLiveEnd]);

    if (sortedEvents.length === 0) {
      return (
        <div className={classnames(className, style['room-events'])}>
          <Empty description={formatMessage({ id: 'NoTrtcRoomEvents' })} />
        </div>
      );
    }

    const deviceInfoMap = getDeviceInfoMap(sortedEvents);
    const summary = getRoomEventsSummary(sortedEvents);

    return (
      <div className={classnames(className, style['room-events'])}>
        <Flex vertical gap={16}>
          {renderRoomEventsOverview(timeSummary)}
          {renderRoomEventsSummary(summary)}
          {renderMemberInfoTabs({ eventList: sortedEvents, deviceInfoMap })}
        </Flex>
      </div>
    );
  })
);

export default RoomEvents;
