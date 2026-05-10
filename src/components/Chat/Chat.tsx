import React, { RefObject, useContext } from "react";
import {
  ActionIcon,
  HoverCard,
  TextInput,
} from "@mantine/core";
// import data from '@emoji-mart/data';
import Picker from "@emoji-mart/react";
import { init } from "emoji-mart";
// import onClickOutside from 'react-onclickoutside';
//@ts-expect-error
import Linkify from "react-linkify";
import { SecureLink } from "react-secure-link";
import styles from "./Chat.module.css";

import {
  formatTimestamp,
  getColorForStringHex,
  getDefaultPicture,
  getOrCreateClientId,
  isEmojiString,
} from "../../utils/utils";
import { UserMenu } from "../UserMenu/UserMenu";
import { Socket } from "socket.io-client";
import {
  CSSTransition,
  SwitchTransition,
  TransitionGroup,
} from "react-transition-group";
import { MetadataContext } from "../../MetadataContext";

const clientId = getOrCreateClientId();
const truncateReply = (input?: string, max = 30) =>
  input && input.length > max ? `${input.slice(0, max)}...` : input || "";

interface ChatProps {
  chat: ChatMessage[];
  nameMap: StringDict;
  pictureMap: StringDict;
  socket: Socket;
  scrollTimestamp: number;
  className?: string;
  getMediaDisplayName: (input?: string) => string;
  hide?: boolean;
  isChatDisabled?: boolean;
  owner: string | undefined;
  ref: RefObject<Chat>;
}

export class Chat extends React.Component<ChatProps> {
  static contextType = MetadataContext;
  declare context: React.ContextType<typeof MetadataContext>;
  public state = {
    chatMsg: "",
    replyTo: undefined as
      | { id: string; timestamp: string; msg?: string }
      | undefined,
    isNearBottom: true,
    isPickerOpen: false,
    reactionMenu: {
      isOpen: false,
      selectedMsgId: "",
      selectedMsgTimestamp: "",
      yPosition: 0,
      xPosition: 0,
    },
  };
  messagesRef = React.createRef<HTMLDivElement>();
  chatInputRef = React.createRef<HTMLInputElement>();

  async componentDidMount() {
    this.scrollToBottom();
    this.messagesRef.current?.addEventListener("scroll", this.onScroll);
    init({});
  }

  componentDidUpdate(prevProps: ChatProps) {
    if (this.props.scrollTimestamp !== prevProps.scrollTimestamp) {
      if (prevProps.scrollTimestamp === 0 || this.state.isNearBottom) {
        this.scrollToBottom();
      }
    }
    if (this.props.hide !== prevProps.hide) {
      this.scrollToBottom();
    }
  }

  setReactionMenu = (
    isOpen: boolean,
    selectedMsgId?: string,
    selectedMsgTimestamp?: string,
    yPosition?: number,
    xPosition?: number,
  ) => {
    this.setState({
      reactionMenu: {
        isOpen,
        selectedMsgId,
        selectedMsgTimestamp,
        yPosition,
        xPosition,
      },
    });
  };

  handleReactionClick = (value: string, id?: string, timestamp?: string) => {
    const msg = this.props.chat.find(
      (m) => m.id === id && m.timestamp === timestamp,
    );
    const data = {
      value,
      msgId: id || this.state.reactionMenu.selectedMsgId,
      msgTimestamp: timestamp || this.state.reactionMenu.selectedMsgTimestamp,
    };
    if (msg?.reactions?.[value].includes(clientId)) {
      this.props.socket.emit("CMD:removeReaction", data);
    } else {
      this.props.socket.emit("CMD:addReaction", data);
    }
  };

  updateChatMsg = (e: any) => {
    // console.log(e.target.selectionStart);
    this.setState({ chatMsg: e.target.value });
  };

  sendChatMsg = () => {
    if (!this.state.chatMsg) {
      return;
    }
    if (this.chatTooLong()) {
      return;
    }
    if (this.state.replyTo?.id && this.state.replyTo.timestamp) {
      const chatPayload: ChatPayload = {
        msg: this.state.chatMsg,
        replyToId: this.state.replyTo.id,
        replyToTimestamp: this.state.replyTo.timestamp,
      };
      this.props.socket.emit("CMD:chatV2", chatPayload);
      this.setState({ chatMsg: "", replyTo: undefined });
      return;
    }
    this.setState({ chatMsg: "", replyTo: undefined });
    this.props.socket.emit("CMD:chat", this.state.chatMsg);
  };

  setReplyTo = (id: string, timestamp: string, msg?: string) => {
    this.setState({ replyTo: { id, timestamp, msg } });
    this.chatInputRef.current?.focus();
  };

  clearReplyTo = () => {
    this.setState({ replyTo: undefined });
  };

  chatTooLong = () => {
    return Boolean(this.state.chatMsg?.length > 10000);
  };

  onScroll = () => {
    this.setState({ isNearBottom: this.isChatNearBottom() });
  };

  isChatNearBottom = () => {
    return (
      this.messagesRef.current &&
      this.messagesRef.current.scrollHeight -
        this.messagesRef.current.scrollTop -
        this.messagesRef.current.offsetHeight <
        50
    );
  };

  scrollToBottom = () => {
    if (this.messagesRef.current) {
      this.messagesRef.current.scrollTop =
        this.messagesRef.current.scrollHeight;
    }
  };

  formatMessage = (cmd: string, msg?: string): React.ReactNode | string => {
    if (cmd === "host") {
      return (
        <React.Fragment>
          {`changed the video to `}
          <span style={{ textTransform: "initial" }}>
            {this.props.getMediaDisplayName(msg)}
          </span>
        </React.Fragment>
      );
    } else if (cmd === "playlistAdd") {
      return (
        <React.Fragment>
          {`added to the playlist: `}
          <span style={{ textTransform: "initial" }}>
            {this.props.getMediaDisplayName(msg)}
          </span>
        </React.Fragment>
      );
    } else if (cmd === "seek") {
      return `jumped to ${formatTimestamp(msg)}`;
    } else if (cmd === "play") {
      return `started the video at ${formatTimestamp(msg)}`;
    } else if (cmd === "pause") {
      return `paused the video at ${formatTimestamp(msg)}`;
    } else if (cmd === "playbackRate") {
      return `set the playback rate to ${msg === "0" ? "auto" : `${msg}x`}`;
    } else if (cmd === "lock") {
      return `locked the room`;
    } else if (cmd === "unlock") {
      return "unlocked the room";
    } else if (cmd === "vBrowserTimeout") {
      return (
        <React.Fragment>
          The VBrowser shut down automatically.
          <br />
          Subscribe for longer sessions.
        </React.Fragment>
      );
    } else if (cmd === "vBrowserAlmostTimeout") {
      return (
        <React.Fragment>
          The VBrowser will shut down soon.
          <br />
          Subscribe for longer sessions.
        </React.Fragment>
      );
    }
    return cmd;
  };

  addEmoji = (emoji: any) => {
    this.setState({ chatMsg: this.state.chatMsg + emoji.native });
  };

  render() {
    return (
      <div
        className={`${styles.chatPanel} ${this.props.hide ? styles.chatPanelHidden : ""} ${this.props.className || ""}`}
      >
        <div className={styles.chatHeader}>
          <div className={styles.chatHeaderDots}>
            <span className={styles.chatHeaderDot} />
            <span className={styles.chatHeaderDot} />
            <span className={styles.chatHeaderDot} />
          </div>
          <span className={styles.chatHeaderTitle}>
            nativos@watchparty:~/chat
          </span>
        </div>
        <div className={styles.chatContainer} ref={this.messagesRef}>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {this.props.chat.map((msg) => (
              <ChatMessage
                key={msg.timestamp + msg.id}
                className={
                  msg.id === this.state.reactionMenu.selectedMsgId &&
                  msg.timestamp === this.state.reactionMenu.selectedMsgTimestamp
                    ? styles.selected
                    : ""
                }
                message={msg}
                pictureMap={this.props.pictureMap}
                nameMap={this.props.nameMap}
                formatMessage={this.formatMessage}
                owner={this.props.owner}
                socket={this.props.socket}
                isChatDisabled={this.props.isChatDisabled}
                setReactionMenu={this.setReactionMenu}
                handleReactionClick={this.handleReactionClick}
                onReply={this.setReplyTo}
              />
            ))}
          </div>
          {!this.state.isNearBottom && (
            <button className={styles.jumpToBottom} onClick={this.scrollToBottom}>
              ↓ ir para o final
            </button>
          )}
        </div>
        {this.state.isPickerOpen && (
          <div style={{ position: "absolute", bottom: "60px" }}>
            <Picker
              theme="dark"
              previewPosition="none"
              maxFrequentRows={1}
              onEmojiSelect={this.addEmoji}
              onClickOutside={() => this.setState({ isPickerOpen: false })}
            />
          </div>
        )}
        <CSSTransition
          in={this.state.reactionMenu.isOpen}
          timeout={300}
          classNames={{
            enter: styles["reactionMenu-enter"],
            enterActive: styles["reactionMenu-enter-active"],
            exit: styles["reactionMenu-exit"],
            exitActive: styles["reactionMenu-exit-active"],
          }}
          unmountOnExit
        >
          <div
            style={{
              position: "fixed",
              top: Math.min(
                this.state.reactionMenu.yPosition - 150,
                window.innerHeight - 450,
              ),
              left: this.state.reactionMenu.xPosition - 240,
            }}
          >
            <Picker
              theme="dark"
              previewPosition="none"
              maxFrequentRows={1}
              perLine={6}
              onClickOutside={() => this.setReactionMenu(false)}
              onEmojiSelect={(emoji: any) => {
                this.handleReactionClick(emoji.native);
                this.setReactionMenu(false);
              }}
            />
          </div>
          {/* <ReactionMenu
            handleReactionClick={this.handleReactionClick}
            closeMenu={() => this.setReactionMenu(false)}
            yPosition={this.state.reactionMenu.yPosition}
            xPosition={this.state.reactionMenu.xPosition}
          /> */}
        </CSSTransition>
        <div className={styles.chatFooter}>
          {this.state.replyTo && (
            <div className={styles.replyComposer}>
              <div className={styles.replyComposerText}>
                <span className={styles.replyComposerArrow}>╰ </span>
                respondendo a{" "}
                <span className={styles.replyComposerUser}>
                  @{this.props.nameMap[this.state.replyTo.id] || "Unknown"}
                </span>
                {this.state.replyTo.msg && (
                  <span className={styles.replyComposerPreview}>
                    {this.state.replyTo.msg}
                  </span>
                )}
              </div>
              <button className={styles.replyClearBtn} onClick={this.clearReplyTo}>
                ✕
              </button>
            </div>
          )}
          <TextInput
            ref={this.chatInputRef}
            onKeyDown={(e: any) => e.key === "Enter" && this.sendChatMsg()}
            onChange={this.updateChatMsg}
            value={this.state.chatMsg}
            error={this.chatTooLong()}
            disabled={this.props.isChatDisabled}
            placeholder={
              this.props.isChatDisabled
                ? "chat desabilitado pelo dono da sala"
                : "mensagem..."
            }
            classNames={{ input: styles.chatTextInput }}
            leftSection={<span className={styles.chatInputPrompt}>›</span>}
            rightSection={
              <ActionIcon
                variant="subtle"
                color="gray"
                onClick={() => {
                  const curr = this.state.isPickerOpen;
                  setTimeout(() => this.setState({ isPickerOpen: !curr }), 100);
                }}
                disabled={this.props.isChatDisabled}
              >
                <span role="img" aria-label="Emoji">😀</span>
              </ActionIcon>
            }
          />
        </div>
      </div>
    );
  }
}

const ChatMessage = ({
  message,
  nameMap,
  pictureMap,
  formatMessage,
  socket,
  owner,
  isChatDisabled,
  setReactionMenu,
  handleReactionClick,
  onReply,
  className,
}: {
  message: ChatMessage;
  nameMap: StringDict;
  pictureMap: StringDict;
  formatMessage: (cmd: string, msg?: string) => React.ReactNode;
  socket: Socket;
  owner: string | undefined;
  isChatDisabled: boolean | undefined;
  setReactionMenu: (
    isOpen: boolean,
    selectedMsgId?: string,
    selectedMsgTimestamp?: string,
    yPosition?: number,
    xPosition?: number,
  ) => void;
  handleReactionClick: (value: string, id?: string, timestamp?: string) => void;
  onReply: (id: string, timestamp: string, msg?: string) => void;
  className: string;
}) => {
  const { user } = useContext(MetadataContext);
  const { id, timestamp, cmd, msg, system, isSub, reactions, videoTS } =
    message;
  const spellFull = 5;
  const imageMsg = renderImageString(msg);
  const timeStr = new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const displayName = Boolean(system) ? "system" : nameMap[id] || id;
  const userColor = "#" + getColorForStringHex(id);

  return (
    <div
      className={`${styles.comment} ${className} ${
        message.replyToUserId === clientId ? styles.replyMessage : ""
      }`}
    >
      {cmd ? (
        /* ── System / command line ── */
        <div className={styles.systemLine}>
          <div className={styles.linePrefix}>
            <span className={styles.timestamp}>[{timeStr}]</span>
            <span className={styles.systemPrefix}>//</span>
            <span className={styles.systemUser} style={{ color: userColor }}>
              {displayName}
            </span>
          </div>
          <span className={styles.systemAction}>
            {formatMessage(cmd, msg)}
            {Boolean(videoTS) && <span> @ {formatTimestamp(videoTS)}</span>}
          </span>
        </div>
      ) : (
        /* ── Chat line ── */
        <>
          {message.replyToUserId && (
            <HoverCard withinPortal={false} openDelay={120}>
              <HoverCard.Target>
                <div className={styles.replyInfo}>
                  @{nameMap[message.replyToUserId] || "user"}
                  {message.replyToMsg && `: ${truncateReply(message.replyToMsg, 40)}`}
                </div>
              </HoverCard.Target>
              <HoverCard.Dropdown className={styles.replyTooltip}>
                {message.replyToMsg || ""}
              </HoverCard.Dropdown>
            </HoverCard>
          )}
          <div className={styles.terminalLine}>
            <div className={styles.linePrefix}>
              <span
                className={styles.timestamp}
                title={new Date(timestamp).toLocaleString()}
              >
                [{timeStr}]
              </span>
              <UserMenu
                displayName={nameMap[id] || id}
                timestamp={timestamp}
                socket={socket}
                userToManage={id}
                isChatMessage
                disabled={!Boolean(owner && owner === user?.uid)}
                trigger={
                  <span
                    className={`${styles.username} ${isSub ? styles.subscriber : ""} ${styles.hoverEffect}`}
                    style={{ color: userColor }}
                    title={isSub ? "subscriber" : undefined}
                  >
                    {displayName}
                  </span>
                }
              />
              <span className={styles.promptArrow}>›</span>
            </div>
            <Linkify
              componentDecorator={(
                decoratedHref: string,
                decoratedText: string,
                key: string,
              ) => (
                <SecureLink href={decoratedHref} key={key}>
                  {decoratedText}
                </SecureLink>
              )}
            >
              <span
                className={`${styles.messageText} ${
                  isEmojiString(msg) ? styles.emoji : ""
                }`}
              >
                {msg}
              </span>
            </Linkify>
          </div>
          {imageMsg && (
            <div style={{ paddingLeft: 4, marginTop: 2 }}>{imageMsg}</div>
          )}
        </>
      )}

      {/* Hover action menu */}
      <div className={styles.commentMenu}>
        {id && id !== clientId && (
          <ActionIcon
            size="xs"
            variant="subtle"
            onClick={() => onReply(id, timestamp, msg)}
            disabled={isChatDisabled}
            title="Reply"
          >
            <span style={{ fontSize: 12 }}>↩</span>
          </ActionIcon>
        )}
        <ActionIcon
          size="xs"
          variant="subtle"
          title="React"
          disabled={isChatDisabled}
          onClick={(e) => {
            //@ts-expect-error
            const viewportOffset = e.target.getBoundingClientRect();
            setTimeout(() => {
              setReactionMenu(
                true,
                id,
                timestamp,
                viewportOffset.top,
                viewportOffset.right,
              );
            }, 100);
          }}
        >
          <span style={{ fontSize: 12 }}>😀</span>
        </ActionIcon>
      </div>

      {/* Reactions */}
      <TransitionGroup>
        {Object.keys(reactions ?? []).map((key) =>
          reactions?.[key].length ? (
            <CSSTransition
              key={key}
              timeout={200}
              classNames={{
                enter: styles["reaction-enter"],
                enterActive: styles["reaction-enter-active"],
                exit: styles["reaction-exit"],
                exitActive: styles["reaction-exit-active"],
              }}
              unmountOnExit
            >
              <HoverCard>
                <HoverCard.Target>
                  <div
                    className={`${styles.reactionContainer} ${
                      reactions[key].includes(clientId) ? styles.highlighted : ""
                    }`}
                    onClick={() =>
                      handleReactionClick(key, message.id, message.timestamp)
                    }
                  >
                    <span style={{ fontSize: 14 }}>{key}</span>
                    <SwitchTransition>
                      <CSSTransition
                        key={key + "-" + reactions[key].length}
                        classNames={{
                          enter: styles["reactionCounter-enter"],
                          enterActive: styles["reactionCounter-enter-active"],
                          exit: styles["reactionCounter-exit"],
                          exitActive: styles["reactionCounter-exit-active"],
                        }}
                        addEndListener={(node, done) =>
                          node.addEventListener("transitionend", done, false)
                        }
                        unmountOnExit
                      >
                        <span
                          style={{
                            color: "var(--nc-text-secondary)",
                            fontFamily: '"IBM Plex Mono", monospace',
                            fontSize: 10,
                            marginLeft: 3,
                          }}
                        >
                          {reactions[key].length}
                        </span>
                      </CSSTransition>
                    </SwitchTransition>
                  </div>
                </HoverCard.Target>
                <HoverCard.Dropdown
                  style={{
                    fontFamily: '"IBM Plex Mono", monospace',
                    fontSize: 11,
                    background: "var(--nc-bg-card)",
                    border: "1px solid var(--nc-border)",
                    color: "var(--nc-text-secondary)",
                  }}
                >
                  {`${reactions[key]
                    .slice(0, spellFull)
                    .map((id) => nameMap[id] || "Unknown")
                    .concat(
                      reactions[key].length > spellFull
                        ? [`${reactions[key].length - spellFull} more`]
                        : [],
                    )
                    .reduce(
                      (text, value, i, array) =>
                        text + (i < array.length - 1 ? ", " : " and ") + value,
                    )} reacted.`}
                </HoverCard.Dropdown>
              </HoverCard>
            </CSSTransition>
          ) : null,
        )}
      </TransitionGroup>
    </div>
  );
};

export const renderImageString = (
  input: string | undefined,
): React.ReactNode | null => {
  // If a valid image string, return an image
  let regex =
    /^https?:\/\/.*\/.*\.(png|gif|webp|jpeg|jpg|heic|heif|jfif)\??.*$/gim;
  if (String(input)?.match(regex)) {
    return <img style={{ maxWidth: "100%" }} src={input} />;
  }
  return null;
};

// class ReactionMenuInner extends React.Component<{
//   handleReactionClick: (value: string, id?: string, timestamp?: string) => void;
//   closeMenu: () => void;
//   yPosition: number;
//   xPosition: number;
// }> {
//   state = {
//     containerWidth: 0,
//   };
//   handleClickOutside = () => {
//     this.props.closeMenu();
//   };
//   containerRef = React.createRef<HTMLDivElement>();
//   componentDidMount() {
//     this.setState({ containerWidth: this.containerRef.current?.offsetWidth });
//   }
//   render() {
//     return (
//       <div
//         ref={this.containerRef}
//         className={styles.reactionMenuContainer}
//         style={{
//           top: this.props.yPosition - 9,
//           left: this.props.xPosition - this.state.containerWidth - 35,
//         }}
//       >
//         {reactionEmojis.map((reaction) => (
//           <div
//             onClick={() => {
//               this.props.handleReactionClick(reaction);
//               this.props.closeMenu();
//             }}
//             style={{ cursor: 'pointer' }}
//           >
//             {reaction}
//           </div>
//         ))}
//       </div>
//     );
//   }
// }
// const ReactionMenu = onClickOutside(ReactionMenuInner);
