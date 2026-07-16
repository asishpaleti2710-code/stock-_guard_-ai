import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss']
})
export class WelcomeComponent implements AfterViewInit {
  @ViewChild('introVideo') introVideo!: ElementRef<HTMLVideoElement>;

  showIntro = true;
  introFading = false;

  constructor(private router: Router) {}

  ngAfterViewInit(): void {
    const video = this.introVideo.nativeElement;
    // Autoplay muted for browser policy compliance
    video.muted = true;
    video.play().catch(() => {
      // If autoplay blocked, skip intro immediately
      this.skipIntro();
    });
  }

  onVideoEnded(): void {
    this.fadeOutIntro();
  }

  skipIntro(): void {
    this.fadeOutIntro();
  }

  private fadeOutIntro(): void {
    this.introFading = true;
    setTimeout(() => {
      this.showIntro = false;
    }, 800); // match CSS transition duration
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}