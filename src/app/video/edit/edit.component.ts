import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  OnChanges,
  SimpleChanges,
  Output,
  EventEmitter,
} from '@angular/core';
import IClip from 'src/app/models/clip.model';
import { ModalService } from 'src/app/services/modal.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ClipService } from 'src/app/services/clip.service';

@Component({
  selector: 'app-edit',
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.css'],
})
export class EditComponent implements OnInit, OnDestroy, OnChanges {
  @Input() activeClip: IClip | null = null;

  clipID = new FormControl('');
  title = new FormControl('', [Validators.required]);
  editForm = new FormGroup({
    title: this.title,
    id: this.clipID,
  });

  showAlert = false;
  alertMsg = 'Please wait! Updating clip.';
  alertColor = 'blue';
  inSubmission = false;

  @Output() update = new EventEmitter();

  constructor(private modal: ModalService, private clipService: ClipService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.activeClip) {
      return;
    }

    this.inSubmission = false;
    this.showAlert = false;
    this.clipID.setValue(this.activeClip.docID as string);
    this.title.setValue(this.activeClip.title);
  }

  ngOnDestroy(): void {
    this.modal.unregister('editClip');
  }

  ngOnInit(): void {
    this.modal.register('editClip');
  }

  async submit() {
    if (!this.activeClip) {
      return;
    }

    this.inSubmission = true;
    this.showAlert = true;
    this.alertMsg = 'Please wait! Updating clip.';
    this.alertColor = 'blue';

    try {
      await this.clipService.updateClip(
        this.clipID.value as string,
        this.title.value as string
      );
    } catch (e) {
      console.error(e);

      this.inSubmission = false;
      this.showAlert = true;
      this.alertMsg = 'Something went wrong. Try again later.';
      this.alertColor = 'red';

      return;
    }

    this.activeClip.title = this.title.value as string;

    this.update.emit(this.activeClip);

    this.inSubmission = false;
    this.alertMsg = 'Success!';
    this.alertColor = 'green';

    setTimeout(() => {
      this.modal.toggleModal('editClip');
    }, 1000);
  }
}
