import React from "react";
import { Button } from "@mantine/core";
import {
  IconBrandYoutubeFilled,
  IconBrowser,
  IconFile,
  IconLink,
  IconList,
  IconMessageFilled,
  type IconProps,
  IconRefresh,
  IconScreenShare,
  IconVideo,
} from "@tabler/icons-react";
import { NewRoomButton } from "../TopBar/TopBar";
import styles from "./Home.module.css";

export const Home = () => {
  return (
    <div className={styles.page}>
      <Hero
        tag="watchparty · nativos.cloud"
        heroText={
          <>
            Assista junto com
            <br />
            sua <em>equipe</em>.
          </>
        }
        subText="Sincronize vídeos, reaja em tempo real e compartilhe a tela — sem cadastro, sem download."
        action={
          <div className={styles.heroAction}>
            <NewRoomButton size="md" />
          </div>
        }
        image="/screenshot4.png"
      />

      <div className={styles.featuresSection}>
        <div className={styles.featuresSectionInner}>
          <FeatureCard
            Icon={IconBrowser}
            title="VBrowser"
            text="Navegador virtual na nuvem — todos veem a mesma tela em tempo real."
          />
          <FeatureCard
            Icon={IconBrandYoutubeFilled}
            title="YouTube"
            text="Cole o link de qualquer vídeo do YouTube e assista em sincronia."
          />
          <FeatureCard
            Icon={IconScreenShare}
            title="Compartilhar tela"
            text="Transmita uma aba do navegador ou sua área de trabalho."
          />
          <FeatureCard
            Icon={IconFile}
            title="Arquivo"
            text="Faça upload do seu próprio arquivo de vídeo e transmita para a sala."
          />
          <FeatureCard
            Icon={IconLink}
            title="URL"
            text="Cole qualquer URL de vídeo acessível via HTTP para todos assistirem."
          />
        </div>
      </div>

      <Hero
        tag="experiência coletiva"
        heroText={
          <>
            Reaja aos momentos
            <br />
            <em>juntos</em>.
          </>
        }
        subText="Encontre momentos de alegria compartilhada mesmo à distância."
        image="/screenshot18.png"
        reverse
      />

      <div className={styles.featuresSection}>
        <div className={styles.featuresSectionInner}>
          <FeatureCard
            Icon={IconRefresh}
            title="Sincronização"
            text="Play, pause e seek sincronizados para todos — sem ninguém ficar pra trás."
          />
          <FeatureCard
            Icon={IconMessageFilled}
            title="Chat"
            text="Converse com todos na sala em tempo real. Memes encorajados."
          />
          <FeatureCard
            Icon={IconList}
            title="Playlists"
            text="Monte uma fila de vídeos e reorganize à vontade."
          />
          <FeatureCard
            Icon={IconVideo}
            title="Vídeo chat"
            text="Ative o vídeo chat para ficar frente a frente com a galera."
          />
        </div>
      </div>

      <div className={styles.stepsSection}>
        <div className={styles.stepsSectionInner}>
          <div>
            <div className={styles.sectionTitle}>Comece agora.</div>
            <div className={styles.sectionSub}>
              quatro passos, zero burocracia
            </div>
          </div>
          <div className={styles.stepsList}>
            <div className={styles.step}>
              <span className={styles.stepNumber}>01</span>
              <div className={styles.stepText}>
                <span className={styles.stepTextBold}>Crie uma sala</span>
                Clique em "Nova sala" e uma sala privada é gerada para você.
              </div>
            </div>
            <div className={styles.step}>
              <span className={styles.stepNumber}>02</span>
              <div className={styles.stepText}>
                <span className={styles.stepTextBold}>
                  Compartilhe o link
                </span>
                Envie o link da sala para quem você quiser convidar.
              </div>
            </div>
            <div className={styles.step}>
              <span className={styles.stepNumber}>03</span>
              <div className={styles.stepText}>
                <span className={styles.stepTextBold}>
                  Escolha o que assistir
                </span>
                YouTube, URL, arquivo local, VBrowser ou compartilhamento de
                tela.
              </div>
            </div>
            <div className={styles.step}>
              <span className={styles.stepNumber}>04</span>
              <div className={styles.stepText}>
                <span className={styles.stepTextBold}>Aproveite</span>
                Tudo sincronizado automaticamente para todos na sala.
              </div>
            </div>
          </div>
          <div className={styles.stepsAction}>
            <NewRoomButton size="md" />
          </div>
        </div>
      </div>
    </div>
  );
};

const FeatureCard = ({
  Icon,
  text,
  title,
}: {
  Icon: React.ForwardRefExoticComponent<IconProps>;
  text: string;
  title: string;
}) => {
  return (
    <div className={styles.featureCard}>
      <Icon size={28} className={styles.featureIcon} />
      <div className={styles.featureTitle}>{title}</div>
      <div className={styles.featureText}>{text}</div>
    </div>
  );
};

export const Hero = ({
  tag,
  heroText,
  subText,
  action,
  image,
  reverse,
}: {
  tag?: string;
  heroText?: React.ReactNode;
  subText?: string;
  action?: React.ReactNode;
  image?: string;
  reverse?: boolean;
}) => {
  return (
    <div className={styles.hero}>
      <div className={`${styles.heroInner} ${reverse ? styles.reverse : ""}`}>
        <div className={styles.heroContent}>
          {tag && <div className={styles.heroTag}>{tag}</div>}
          {heroText && <div className={styles.heroText}>{heroText}</div>}
          {subText && <div className={styles.subText}>{subText}</div>}
          {action}
        </div>
        {image && (
          <div className={styles.heroImage}>
            <img alt="preview" src={image} />
          </div>
        )}
      </div>
    </div>
  );
};

export const DiscordBot = () => null;
