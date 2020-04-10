
import { styled, run } from "uebersicht"

// CUSTOMIZATION

const options = {
  // Widget size!  --  big | medium | small | mini
  size: "big",
}


// EMOTION COMPONENTS

const Wrapper = styled("div")`
  position: absolute;
  top: 20px;
  left: 20px;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 16px 32px 9px #0005;
  opacity: ${props => props.playing ? 1 : 0};
  transition: opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1);

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    border-radius: 6px;
    -webkit-backdrop-filter: blur(8px) brightness(90%) contrast(80%) saturate(140%);
    backdrop-filter: blur(8px) brightness(90%) contrast(80%) saturate(140%);
    z-index: -1;
  }
`;

const BigPlayer = styled("div")`
  display: flex;
  flex-direction: column;
  width: 240px;
`;

const ArtworkWrapper = styled("div")`
  position: relative;
  width: 240px;
  height: 240px;
  background: url("UeberPlayer.widget/default.png");
  background-size: cover;

  &::before {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    background: #fff7;
  }
`

const Artwork = styled("div")`
  width: 240px;
  height: 240px;
  background: url("${props => props.localArt}"), url("${props => props.onlineArt}"), transparent;
  background-size: cover;
`;

const Information = styled("div")`
  position: relative;
  padding: .5em .75em;
  line-height: 1.3;
  border-radius: 0 0 6px 6px;
  -webkit-backdrop-filter: blur(8px) brightness(90%) contrast(80%) saturate(140%);
  backdrop-filter: blur(8px) brightness(90%) contrast(80%) saturate(140%);

  > p {
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`

const Progress = styled("div")`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: transparent;

  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    width: ${props => props.percent}%;
    background: white;
    transition: width 0.6s cubic-bezier(0.22, 1, 0.36, 1);
  }
`

const Track = styled("p")`
  font-weight: bold;
  font-size: .7em;
`

const Artist = styled("p")`
  font-size: .7em;
`

const Album = styled("p")`
  font-size: .65em;
  color: #e6e6e6;
  opacity: .75;
`

// UEBER-SPECIFIC STUFF //

export const className = `
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
  color: white;

  * {
    box-sizing: border-box;
    padding: 0;
    border: 0;
    margin: 0;
  }
`;

export const command = "osascript UeberPlayer.widget/getTrack.scpt | echo";

export const initialState = {
  playing: false,           // If currently playing a soundtrack
  data: {
    track: "",              // Name of soundtrack
    artist: "",             // Name of artist
    album: "",              // Name of album
    artwork: "",            // Locally stored url for album artwork
    onlineArtwork: "",      // Online url for album artwork
    duration: 0,            // Total duration of soundtrack in seconds
    elapsed: 0              // Total time elapsed in seconds
  }
};

// FUNCTIONS //

// Get album artwork and cache it in memory
const getArtwork = (url, album, artist) => {
  const filename = `${album}-${artist}.jpg`.split(' ').join('');

  // Run an applescript to check if artwork is already cached, and if not, cache it for later use
  run(`osascript UeberPlayer.widget/getArtwork.scpt ${url} "${filename}" | echo`)
  .then((output) => output);

  return `UeberPlayer.widget/cache/${filename}`;
}

// Update state
export const updateState = ({ output, error }, previousState) => {
  // Check for errors
  if (error) {
    console.log("Something happened!? " + error);
    return { ...previousState, error: error };
  }

  // Extract & parse applescript output
  let [
    playing,
    track,
    artist,
    album,
    artworkURL,
    duration,
    elapsed
  ] = output.split("\n").slice(1, -1);
  playing = playing === "true";

  // State controller
  if (!playing) {   // If player is paused
    return { ...previousState, playing };
  } else if (track !== previousState.data.track || album !== previousState.data.album) {    // Song change
    return {
      playing,
      data: {
        track,
        artist,
        album,
        artwork: getArtwork(artworkURL, album, artist),
        onlineArtwork: artworkURL,
        duration,
        elapsed
      }
    }
  } else {  // Currently playing
    return { playing, data: { ...previousState.data, elapsed }};
  }
}

// Big player component
const big = ({ track, artist, album, artwork, onlineArtwork, elapsed, duration }) => (
  <BigPlayer>
    <ArtworkWrapper>
      <Artwork localArt={artwork} onlineArt={onlineArtwork}/>
    </ArtworkWrapper>
    <Information>
      <Progress percent={elapsed / duration * 100}/>
      <Track>{track}</Track>
      <Artist>{artist}</Artist>
      <Album>{album}</Album>
    </Information>
  </BigPlayer>
);

// Render function
export const render = ({ playing, data }) => {
  const { size } = options;

  return (
    <Wrapper playing={playing}>
      {size === "big" && big(data)}
    </Wrapper>
  )
};