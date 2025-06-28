import { Title } from "@solidjs/meta";

export default function SiteTitle(props) {
  return <Title>{props.children} | My Site</Title>;
}