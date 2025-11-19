"use client";

import dynamic from 'next/dynamic';
import styles from './page.module.css';

const VideoShowcase = dynamic(() => import('./src/VideoShowcase'), { ssr: false });

export default function Page() {
  return (
    <main className={styles.container}>
      <VideoShowcase />
    </main>
  );
}
