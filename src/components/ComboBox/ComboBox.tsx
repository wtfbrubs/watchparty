import React from "react";
import {
  debounce,
  getMediaPathResults,
  getYouTubeResults,
  isHttp,
  isMagnet,
  isYouTube,
} from "../../utils/utils";
import { examples } from "../../utils/examples";
import ChatVideoCard from "../ChatVideoCard/ChatVideoCard";
import { IconX } from "@tabler/icons-react";
import {
  ActionIcon,
  Autocomplete,
  Loader,
  type AutocompleteProps,
} from "@mantine/core";
import styles from "./ComboBox.module.css";

type ComboBoxProps = {
  roomSetMedia: (value: string) => void;
  playlistAdd: (value: string) => void;
  roomMedia: string;
  getMediaDisplayName: (input: string) => string;
  mediaPath: string | undefined;
  disabled?: boolean;
  roomName?: string;
};

type ComboBoxState = {
  inputMedia?: string;
  items: SearchResult[];
  loading: boolean;
};

export class ComboBox extends React.Component<ComboBoxProps, ComboBoxState> {
  state: ComboBoxState = {
    inputMedia: undefined as string | undefined,
    items: [] as SearchResult[],
    loading: false,
  };

  setMediaAndClose = (value: string) => {
    this.props.roomSetMedia(value);
    this.setState({ inputMedia: undefined, items: [] });
  };

  doSearch = async () => {
    const value = this.state.inputMedia;
    this.setState({ loading: true });
    const query: string = value || "";
    let items = examples;
    if (
      query === "" ||
      // Anything that doesn't pass this check we pass to YouTube as a search query
      (query && (isHttp(query) || isMagnet(query)))
    ) {
      if (!value && this.props.mediaPath) {
        items = await getMediaPathResults(this.props.mediaPath, "");
      }
      if (query) {
        let type: SearchResult["type"] = "file";
        if (isYouTube(query)) {
          type = "youtube";
        }
        if (isMagnet(query)) {
          type = "magnet";
        }
        // Create entry from user input
        items = [
          {
            name: query,
            type,
            url: query,
            duration: 0,
          },
        ];
      }
    } else {
      const data = await getYouTubeResults(query);
      items = data;
    }
    this.setState({
      loading: false,
      items,
    });
  };

  debouncedSearch = debounce(this.doSearch);

  onChange = (value: string) => {
    this.setState({ inputMedia: value }, this.debouncedSearch);
  };

  render() {
    const { roomMedia: currentMedia, getMediaDisplayName } = this.props;
    const renderOption: AutocompleteProps["renderOption"] = ({ option }) => {
      const video = this.state.items.find((item) => item.url === option.value);
      return (
        <div
          key={option.value}
          onClick={(e) => this.setMediaAndClose(option.value)}
          style={{ width: "100%" }}
        >
          {video && (
            <ChatVideoCard
              video={video}
              index={0}
              onPlaylistAdd={this.props.playlistAdd}
            />
          )}
        </div>
      );
    };
    return (
      <div className={styles.terminalWrapper}>
        <div className={styles.terminalBar}>
          <div className={styles.terminalDots}>
            <span className={styles.dot} />
            <span className={styles.dot} />
            <span className={styles.dot} />
          </div>
          <span className={styles.terminalTitle}>
            nativos@watchparty:~/<em>{this.props.roomName || "sala"}</em>
          </span>
        </div>
        <Autocomplete
          maxDropdownHeight={400}
          disabled={this.props.disabled}
          onChange={this.onChange}
          onFocus={(e: any) => {
            this.setState(
              {
                inputMedia:
                  isHttp(currentMedia) || isMagnet(currentMedia)
                    ? currentMedia
                    : getMediaDisplayName(currentMedia),
              },
              () => {
                if (
                  !this.state.inputMedia ||
                  (this.state.inputMedia &&
                    (isHttp(this.state.inputMedia) ||
                      isMagnet(this.state.inputMedia)))
                ) {
                  this.doSearch();
                }
                e.target.select();
              },
            );
          }}
          onBlur={() => {
            this.setState({
              inputMedia: undefined,
              items: [],
            });
          }}
          onKeyDown={(e: any) => {
            if (e.key === "Enter") {
              this.setMediaAndClose(this.state.inputMedia ?? "");
              e.target.blur();
            }
          }}
          rightSection={
            this.props.roomMedia ? (
              <ActionIcon
                variant="subtle"
                color="gray"
                onClick={(e: any) => this.setMediaAndClose("")}
                title="Limpar"
              >
                <IconX size={14} />
              </ActionIcon>
            ) : null
          }
          leftSection={
            this.state.loading ? (
              <Loader size="xs" />
            ) : (
              <span className={styles.prompt}>$</span>
            )
          }
          classNames={{
            input: styles.input,
            section: styles.section,
            dropdown: styles.dropdown,
            option: styles.option,
          }}
          placeholder="URL, YouTube, magnet link..."
          value={
            this.state.inputMedia !== undefined
              ? this.state.inputMedia
              : getMediaDisplayName(currentMedia)
          }
          renderOption={renderOption}
          data={this.state.items.map((item) => item.url)}
          filter={({ options }) => options}
        />
      </div>
    );
  }
}
