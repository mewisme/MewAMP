import { TitlebarContainer } from './titlebar-container';
import { WindowsButtons } from './windows-buttons';
import appIcon from '@/assets/app-icon.png';

export function WindowsTitlebar() {
  return (
    <TitlebarContainer>
      <div data-tauri-drag-region className="flex items-center justify-center h-full px-3">
        <img src={appIcon} alt="MewAMP" className="w-4 h-4 mr-2" />
        <span className="text-[13px] font-medium text-foreground/70 pointer-events-none">MewAMP</span>
      </div>

      <div className="absolute h-full right-0">
        <WindowsButtons />
      </div>
    </TitlebarContainer>
  );
}
