import StudioClient from './studio-client';
import { Room } from './Room';

interface StudioPageProps {
  params: Promise<{ roomId: string }>;
}

export async function generateMetadata({ params }: StudioPageProps) {
  const { roomId } = await params;
  return {
    title: `${roomId} — MagicStudio`,
    description: `Design and mint NFTs in studio room "${roomId}"`,
  };
}

export default async function StudioPage({ params }: StudioPageProps) {
  const { roomId } = await params;
  return (
    <Room roomId={roomId}>
      <StudioClient roomId={roomId} />
    </Room>
  );
}
