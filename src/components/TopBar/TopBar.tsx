import React, { useCallback, useContext } from "react";
import { serverPath, getUserImage } from "../../utils/utils";
import { ActionIcon, Avatar, Button, Menu, Text } from "@mantine/core";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import { LoginModal } from "../Modal/LoginModal";
import { SubscribeButton } from "../SubscribeButton/SubscribeButton";
import { ProfileModal } from "../Modal/ProfileModal";
import { MetadataContext } from "../../MetadataContext";
import {
  IconCirclePlusFilled,
  IconDatabase,
  IconLogin,
  IconTrash,
} from "@tabler/icons-react";
import styles from "./TopBar.module.css";

export async function createRoom(
  user: firebase.User | undefined,
  openNewTab: boolean | undefined,
  video: string = "",
) {
  const uid = user?.uid;
  const token = await user?.getIdToken();
  const response = await fetch(serverPath + "/createRoom", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      uid,
      token,
      video,
    }),
  });
  const data = await response.json();
  const { name } = data;
  if (openNewTab) {
    window.open("/watch" + name);
  } else {
    window.location.assign("/watch" + name);
  }
}

export const NewRoomButton = (props: {
  size?: string;
  openNewTab?: boolean;
}) => {
  const context = useContext(MetadataContext);
  const onClick = useCallback(async () => {
    await createRoom(context.user, props.openNewTab);
  }, [context.user, props.openNewTab]);
  return (
    <Button
      variant="unstyled"
      className={styles.navCta}
      onClick={onClick}
      leftSection={<IconCirclePlusFilled size={13} />}
    >
      Nova sala
    </Button>
  );
};

type SignInButtonProps = {};

export class SignInButton extends React.Component<SignInButtonProps> {
  static contextType = MetadataContext;
  declare context: React.ContextType<typeof MetadataContext>;
  public state = { isLoginOpen: false, isProfileOpen: false, userImage: null };

  async componentDidUpdate(prevProps: SignInButtonProps) {
    if (this.context.user && !this.state.userImage) {
      this.setState({ userImage: await getUserImage(this.context.user) });
    }
  }

  render() {
    if (this.context.user) {
      return (
        <>
          <Avatar
            src={this.state.userImage}
            size="sm"
            style={{ cursor: "pointer" }}
            onClick={() => this.setState({ isProfileOpen: true })}
          />
          {this.state.isProfileOpen && this.context.user && (
            <ProfileModal
              userImage={this.state.userImage}
              close={() => this.setState({ isProfileOpen: false })}
            />
          )}
        </>
      );
    }
    return (
      <>
        {this.state.isLoginOpen && (
          <LoginModal
            closeModal={() => this.setState({ isLoginOpen: false })}
          />
        )}
        <Button
          variant="unstyled"
          className={styles.ghostBtn}
          leftSection={<IconLogin size={13} />}
          onClick={() => this.setState({ isLoginOpen: true })}
        >
          Entrar
        </Button>
      </>
    );
  }
}

export class ListRoomsButton extends React.Component<{}> {
  static contextType = MetadataContext;
  declare context: React.ContextType<typeof MetadataContext>;
  public state = { rooms: [] as PersistentRoom[] };

  componentDidMount() {
    this.refreshRooms();
  }

  refreshRooms = async () => {
    if (this.context.user) {
      const token = await this.context.user.getIdToken();
      const response = await fetch(
        serverPath + `/listRooms?uid=${this.context.user?.uid}&token=${token}`,
      );
      this.setState({ rooms: await response.json() });
    }
  };

  deleteRoom = async (roomId: string) => {
    if (this.context.user) {
      const token = await this.context.user.getIdToken();
      await fetch(
        serverPath +
          `/deleteRoom?uid=${this.context.user?.uid}&token=${token}&roomId=${roomId}`,
        { method: "DELETE" },
      );
      this.setState({
        rooms: this.state.rooms.filter((room) => room.roomId !== roomId),
      });
      this.refreshRooms();
    }
  };

  render() {
    return (
      <Menu>
        <Menu.Target>
          <Button
            variant="unstyled"
            className={styles.ghostBtn}
            onClick={this.refreshRooms}
            leftSection={<IconDatabase size={13} />}
          >
            Minhas salas
          </Button>
        </Menu.Target>
        <Menu.Dropdown>
          {this.state.rooms.length === 0 && (
            <Menu.Item disabled>Nenhuma sala permanente.</Menu.Item>
          )}
          {this.state.rooms.map((room: any) => {
            return (
              <Menu.Item
                key={room.roomId}
                component="a"
                href={
                  room.vanity ? "/r/" + room.vanity : "/watch" + room.roomId
                }
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  <div>
                    <Text size="sm" ff="monospace">
                      {room.vanity
                        ? `/r/${room.vanity}`
                        : `/watch${room.roomId}`}
                    </Text>
                    <Text size="xs" c="dimmed" ff="monospace">
                      {room.roomId}
                    </Text>
                  </div>
                  <div style={{ marginLeft: "auto", paddingLeft: "20px" }}>
                    <ActionIcon
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        e.nativeEvent.stopImmediatePropagation();
                        e.preventDefault();
                        this.deleteRoom(room.roomId);
                      }}
                      color="red"
                      variant="subtle"
                    >
                      <IconTrash size={14} />
                    </ActionIcon>
                  </div>
                </div>
              </Menu.Item>
            );
          })}
        </Menu.Dropdown>
      </Menu>
    );
  }
}

export const TopBar = (props: {
  hideNewRoom?: boolean;
  hideSignin?: boolean;
  hideMyRooms?: boolean;
  roomTitle?: string;
  roomDescription?: string;
  roomTitleColor?: string;
}) => {
  const context = useContext(MetadataContext);
  return (
    <React.Fragment>
      <div className={styles.topBar}>
        <a href="/" className={styles.logo}>
          <span className={styles.prompt}>&gt;_</span>
          watchpart<span className={styles.logoDotCloud}>y</span>
        </a>

        {props.roomTitle || props.roomDescription ? (
          <div className={styles.roomInfo}>
            <div
              className={styles.roomTitle}
              style={{ color: props.roomTitleColor || "var(--nc-text-primary)" }}
            >
              {props.roomTitle}
            </div>
            {props.roomDescription && (
              <div className={styles.roomDescription}>
                {props.roomDescription}
              </div>
            )}
          </div>
        ) : null}

        <div className={styles.actions}>
          {!props.hideNewRoom && <NewRoomButton openNewTab />}
          {!props.hideMyRooms && context.user && <ListRoomsButton />}
          <SubscribeButton />
          {!props.hideSignin && <SignInButton />}
        </div>
      </div>
    </React.Fragment>
  );
};
