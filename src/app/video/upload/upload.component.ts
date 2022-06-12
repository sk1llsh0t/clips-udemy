import { Component, OnDestroy } from '@angular/core';
import {
  AngularFireStorage,
  AngularFireUploadTask,
} from '@angular/fire/compat/storage';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { v4 as uuid } from 'uuid';
import { switchMap } from 'rxjs/operators';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import firebase from 'firebase/compat/app';
import { ClipService } from 'src/app/services/clip.service';
import IClip from 'src/app/models/clip.model';
import { Router } from '@angular/router';
import { FfmpegService } from 'src/app/services/ffmpeg.service';
import { combineLatest, forkJoin } from 'rxjs';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css'],
})
export class UploadComponent implements OnDestroy {
  selectedScreenshot = '';
  isDragover = false;
  file: File | null = null;
  nextStep = false;
  user: firebase.User | null = null;
  task?: AngularFireUploadTask;
  screenshotTask?: AngularFireUploadTask;
  title = new FormControl('', [Validators.required]);
  uploadForm = new FormGroup({
    title: this.title,
  });

  showAlert = false;
  alertMsg = 'Please wait! We are uploading your clip.';
  alertColor = 'blue';
  inSubmission = false;
  showPercentage = true;
  percentage = 0;
  screenshots: string[] = [];

  constructor(
    private storage: AngularFireStorage,
    private auth: AngularFireAuth,
    private clipService: ClipService,
    private router: Router,
    public ffmpegService: FfmpegService
  ) {
    auth.user.subscribe((user) => (this.user = user));
    this.ffmpegService.init();
  }

  ngOnDestroy(): void {
    this.task?.cancel();
  }

  async storeFile($event: Event) {
    if (this.ffmpegService.isRunning) {
      return;
    }

    this.isDragover = false;

    this.file = ($event as DragEvent).dataTransfer
      ? ($event as DragEvent).dataTransfer?.files.item(0) ?? null
      : ($event.target as HTMLInputElement).files?.item(0) ?? null;

    if (!this.file || this.file.type !== 'video/mp4') {
      return;
    }

    this.screenshots = await this.ffmpegService.getScreenshots(this.file);
    this.selectedScreenshot = this.screenshots[0];

    this.uploadForm.controls.title.setValue(
      this.file.name.replace(/\.[^/.]+$/, '')
    );

    this.nextStep = true;
  }

  async uploadFile() {
    this.uploadForm.disable();

    this.inSubmission = true;
    this.alertMsg = 'Please wait! Your clip is being uploaded.';
    this.alertColor = 'blue';
    this.showPercentage = true;
    this.showAlert = true;

    const clipFilename = uuid();
    const clipPath = `clips/${clipFilename}.mp4`;

    const screenshotBlob = await this.ffmpegService.blobFromURL(
      this.selectedScreenshot
    );
    const screenshotPath = `screenshots/${clipFilename}.png`;

    this.percentage = 0;
    this.task = this.storage.upload(clipPath, this.file);

    const clipRef = this.storage.ref(clipPath);
    const screenshotRef = this.storage.ref(screenshotPath);

    this.screenshotTask = this.storage.upload(screenshotPath, screenshotBlob);

    combineLatest([
      this.task.percentageChanges(),
      this.screenshotTask.percentageChanges(),
    ]).subscribe((progress) => {
      const [clipProgress, screenshotProgress] = progress;

      if (!clipProgress || !screenshotProgress) {
        return;
      }

      const total = clipProgress + screenshotProgress;

      this.percentage = (total as number) / 200;
    });

    forkJoin([
      this.task.snapshotChanges(),
      this.screenshotTask.snapshotChanges(),
    ])
      .pipe(
        switchMap(() =>
          forkJoin([clipRef.getDownloadURL(), screenshotRef.getDownloadURL()])
        )
      )
      .subscribe({
        next: async (urls) => {
          const [clipURL, screenshotURL] = urls;

          const clip: IClip = {
            uid: this.user?.uid as string,
            displayName: this.user?.displayName as string,
            title: this.title.value as string,
            fileName: `${clipFilename}.mp4`,
            url: clipURL,
            screenshotURL,
            screenshotFilename: `${clipFilename}.png`,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          };

          const clipDocRef = await this.clipService.createClip(clip);

          this.showPercentage = false;
          this.alertMsg = 'Success! Your clip is now ready to share.';
          this.alertColor = 'green';

          setTimeout(() => {
            this.router.navigate(['clip', clipDocRef.id]);
          }, 1000);
        },
        error: (error) => {
          this.uploadForm.enable();

          this.alertMsg = 'Upload failed! Please try again later.';
          this.alertColor = 'red';
          this.inSubmission = false;
          this.showPercentage = false;

          console.log(error);
        },
      });
  }

  selectScreenshot(screenshot: string) {
    this.selectedScreenshot = screenshot;
  }

  setScreenshotBorder(screenshot: string) {
    if (screenshot == this.selectedScreenshot) {
      return 'border-8 cursor-pointer border-green-400';
    } else {
      return 'border-8 cursor-pointer bg-transparent';
    }
  }
}
