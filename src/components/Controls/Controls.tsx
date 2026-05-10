import React, { useMemo, useState } from "react";
import { Menu, Slider } from "@mantine/core";
import { formatTimestamp, softWhite } from "../../utils/utils";
import styles from "./Controls.module.css";
import { MetadataContext } from "../../MetadataContext";
import {
  IconPlayerPlayFilled,
  IconPlayerPauseFilled,
  IconRefresh,
  IconCheck,
  IconRepeat,
  IconBadgeCc,
  IconVolumeOff,
  IconVolume,
  IconTheater,
  IconMaximize,
  IconPlayerSkipForwardFilled,
} from "@tabler/icons-react";

interface ControlsProps {
  duration: number;
  video: string;
  paused: boolean;
  muted: boolean;
  volume: number;
  subtitled: boolean;
  currentTime: number;
  disabled?: boolean;
  leaderTime?: number;
  isPauseDisabled?: boolean;
  playbackRate: number;
  roomPlaybackRate: number;
  isYouTube: boolean;
  isLiveStream: boolean;
  timeRanges: { start: number; end: number }[];
  loop: boolean;
  roomTogglePlay: () => void;
  roomSeek: (time: number) => void;
  roomSetPlaybackRate: (rate: number) => void;
  roomSetLoop: (loop: boolean) => void;
  localFullScreen: (fs: boolean) => void;
  localToggleMute: () => void;
  localSubtitleModal: () => void;
  localSeek: () => void;
  localSetVolume: (volume: number) => void;
  localSetSubtitleMode: (mode: TextTrackMode, lang?: string) => void;
  roomPlaylistPlay: (index: number) => void;
  playlist: PlaylistVideo[];
}

export const Controls = (props: ControlsProps) => {
  const [hoverState, setHoverState] = useState({
    hoverTimestamp: 0,
    hoverPos: 0,
  });
  const [showTimestamp, setShowTimestamp] = useState(false);
  const getEnd = () => props.duration;
  const getStart = () => 0;
  const getLength = () => getEnd() - getStart();
  const getCurrent = () => props.currentTime;
  const getPercent = () => (getCurrent() - getStart()) / getLength();
  const zeroTime = useMemo(
    () => Math.floor(Date.now() / 1000) - props.duration,
    [props.video, Boolean(props.duration)],
  );
  const onMouseOver = () => {
    setShowTimestamp(true);
  };
  const onMouseOut = () => {
    setShowTimestamp(false);
  };
  const onMouseMove = (e: any) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    setHoverState({ hoverTimestamp: getStart() + pct * getLength(), hoverPos: pct });
  };
  const {
    roomTogglePlay,
    roomSeek,
    localFullScreen,
    localToggleMute,
    localSubtitleModal,
    localSeek,
    currentTime,
    leaderTime,
    isPauseDisabled,
    disabled,
    subtitled,
    paused,
    muted,
    volume,
    isLiveStream,
    playlist,
    roomPlaylistPlay,
    timeRanges,
    roomSetPlaybackRate,
    roomPlaybackRate,
  } = props;
  // console.log(leaderTime, currentTime);
  const behindThreshold = 10;
  const behindTime =
    !isLiveStream && leaderTime && leaderTime < Infinity
      ? leaderTime - currentTime
      : getEnd() - getCurrent();
  const isBehind = behindTime > behindThreshold;
  const buffers = timeRanges.map(({ start, end }) => (
    <div
      key={start}
      className={styles.timelineBuffer}
      style={{
        left: `${(start / getLength()) * 100}%`,
        width: `${((end - start) / getLength()) * 100}%`,
      }}
    />
  ));
  const playPauseProps = {
    onClick: () => {
      roomTogglePlay();
    },
    className: ` ${styles.action}`,
    disabled: disabled || isPauseDisabled,
  };
  return (
    <div className={styles.controls}>
      {paused ? (
        <IconPlayerPlayFilled {...playPauseProps} />
      ) : (
        <IconPlayerPauseFilled {...playPauseProps} />
      )}
      {playlist.length > 0 && (
        <IconPlayerSkipForwardFilled
          title="Skip to next"
          className={styles.action}
          onClick={() => roomPlaylistPlay(0)}
        />
      )}
      <button
        className={`${styles.syncBtn} ${isBehind ? styles.syncBtnBehind : ""}`}
        title="Sincronizar"
        onClick={() => {
          if (isLiveStream) {
            roomSeek(props.duration);
          } else {
            localSeek();
          }
        }}
      >
        sync
      </button>
      <div className={styles.text}>
        {formatTimestamp(getCurrent(), isLiveStream ? zeroTime : undefined)}
      </div>
      <div
        className={styles.timeline}
        onClick={(e: any) => {
          if (!disabled) {
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            roomSeek(getLength() * pct);
          }
        }}
        onMouseOver={onMouseOver}
        onMouseOut={onMouseOut}
        onMouseMove={onMouseMove}
      >
        <div className={styles.timelineTrack}>
          {buffers}
          <div
            className={styles.timelineFill}
            style={{ width: `${getPercent() * 100}%` }}
          />
          <div
            className={styles.timelineThumb}
            style={{ left: `${getPercent() * 100}%` }}
          />
        </div>
        {getLength() < Infinity && showTimestamp && (
          <div
            className={styles.timelineTooltip}
            style={{ left: `${hoverState.hoverPos * 100}%` }}
          >
            {formatTimestamp(hoverState.hoverTimestamp, isLiveStream ? zeroTime : undefined)}
          </div>
        )}
      </div>
      <div className={styles.text}>{formatTimestamp(getEnd())}</div>
      {isLiveStream && (
        <span className={styles.liveBadge}>LIVE</span>
      )}
      <Menu disabled={disabled}>
          <Menu.Target>
            <button className={`${styles.rateBtn} ${styles.action}`}>
              {props.playbackRate?.toFixed(2)}x
            </button>
          </Menu.Target>
          <Menu.Dropdown>
            {[
              { key: "Auto", text: "Auto", value: 0 },
              { key: "0.25", text: "0.25x", value: 0.25 },
              { key: "0.5", text: "0.5x", value: 0.5 },
              // { key: '0.75', text: '0.75x', value: 0.75 },
              { key: "1", text: "1x", value: 1 },
              // { key: '1.25', text: '1.25x', value: 1.25 },
              { key: "1.5", text: "1.5x", value: 1.5 },
              // { key: '1.75', text: '1.75x', value: 1.75 },
              { key: "2", text: "2x", value: 2 },
              { key: "3", text: "3x", value: 3 },
            ].map((item) => (
              <Menu.Item
                key={item.key}
                onClick={() => roomSetPlaybackRate(item.value)}
                rightSection={
                  roomPlaybackRate === item.value ? <IconCheck /> : null
                }
              >
                {item.text}
              </Menu.Item>
            ))}
          </Menu.Dropdown>
        </Menu>
      <IconRepeat
        onClick={() => {
          if (!disabled) {
            props.roomSetLoop(Boolean(!props.loop));
          }
        }}
        className={` ${styles.action}`}
        title="Loop"
        color={props.loop ? "green" : softWhite}
      />
      {props.isYouTube ? (
        <Menu>
          <Menu.Target>
            <IconBadgeCc className={styles.action} />
          </Menu.Target>
          <Menu.Dropdown>
            {[
              { key: "hidden", text: "Off", value: "hidden" },
              { key: "en", text: "English", value: "showing" },
              { key: "es", text: "Spanish", value: "showing" },
            ].map((item) => (
              <Menu.Item
                key={item.key}
                onClick={() =>
                  props.localSetSubtitleMode(
                    item.value as TextTrackMode,
                    item.key,
                  )
                }
              >
                {item.text}
              </Menu.Item>
            ))}
          </Menu.Dropdown>
        </Menu>
      ) : (
        <IconBadgeCc
          onClick={() => {
            localSubtitleModal();
          }}
          className={` ${styles.action}`}
          title="Captions"
          color={subtitled ? "green" : softWhite}
        />
      )}
      <IconTheater
        onClick={() => localFullScreen(false)}
        className={` ${styles.action}`}
        title="Theater Mode"
      />
      <IconMaximize
        onClick={() => localFullScreen(true)}
        className={` ${styles.action}`}
        title="Fullscreen"
      />
      {muted ? (
        <IconVolumeOff
          onClick={() => {
            localToggleMute();
          }}
          className={` ${styles.action}`}
        />
      ) : (
        <IconVolume
          onClick={() => {
            localToggleMute();
          }}
          className={` ${styles.action}`}
        />
      )}
      <div style={{ width: "80px" }}>
        <Slider
          defaultValue={volume}
          disabled={muted}
          min={0}
          max={1}
          step={0.01}
          onChangeEnd={(value: number) => props.localSetVolume(value)}
          classNames={{
            track: styles.sliderTrack,
            bar: styles.sliderBar,
            thumb: styles.sliderThumb,
          }}
        />
      </div>
    </div>
  );
};
