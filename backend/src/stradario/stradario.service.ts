import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Strada, StradaDocument } from './schemas/strada.schema';

@Injectable()
export class StradarioService {
  constructor(@InjectModel(Strada.name) private stradaModel: Model<StradaDocument>) {}

  findAll() {
    return this.stradaModel.find().sort({ contrada: 1, via: 1 });
  }
}
