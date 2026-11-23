import { Icon } from "@/app/ui/icons";

// The settings rows' icons, from the app's set. They lead their row, so they're teal-soft, like
// every icon that leads a row. See DESIGN.md.
const RowIcon = ({ name }: { name: Parameters<typeof Icon>[0]["name"] }) => (
  <Icon name={name} size={28} className="text-teal-soft" />
);

export const PaceIcon = () => <RowIcon name="timer" />;
export const DirectionIcon = () => <RowIcon name="swap" />;
export const AudioIcon = () => <RowIcon name="speaker" />;
export const DialectIcon = () => <RowIcon name="pin" />;
export const LanguageIcon = () => <RowIcon name="globe" />;

// On the log-out row, so it takes the row's brick.
export const LogOutIcon = () => <Icon name="signOut" size={28} />;
