import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  ViewEncapsulation,
} from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { Subscription } from 'rxjs';
import videojs from 'video.js';
import IClip from '../models/clip.model';
import { DatePipe } from '@angular/common';
@Component({
  selector: 'app-clip',
  templateUrl: './clip.component.html',
  styleUrls: ['./clip.component.css'],
  providers: [DatePipe],
  encapsulation: ViewEncapsulation.None,
})
export class ClipComponent implements OnInit, OnDestroy {
  paramSubscription: Subscription = new Subscription();
  player?: videojs.Player;
  clip?: IClip;

  @ViewChild('videoPlayer', { static: true }) target?: ElementRef;

  constructor(private route: ActivatedRoute) {}

  ngOnDestroy(): void {}

  ngOnInit(): void {
    this.player = videojs(this.target?.nativeElement);

    this.route.data.subscribe((data) => {
      this.clip = data.clip as IClip;

      this.player?.src({ src: this.clip.url, type: 'video/mp4' });
    });
  }
}
