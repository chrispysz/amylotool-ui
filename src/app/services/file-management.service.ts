import { Injectable } from '@angular/core';
import { FastaSequence } from '../models/fasta-sequence';

@Injectable({
  providedIn: 'root'
})
export class FileManagementService {

  constructor() { }
  
  parseFasta(fastaString: string): FastaSequence[] {
    const lines = fastaString.split("\n");
    let currentSequence: FastaSequence = { header: "", sequence: "" };
    const sequences: FastaSequence[] = [];
  
    for (const line of lines) {
      if (line.startsWith(">")) {
        if (currentSequence.header !== "") {
          sequences.push(currentSequence);
        }
        currentSequence = { header: line.slice(1).replace(/[\r\n]/gm, ''), sequence: "" };
      } else {
        currentSequence.sequence += line.replace(/[\r\n]/gm, '');
      }
    }
    
    sequences.push(currentSequence);
    return sequences;
  }
}
