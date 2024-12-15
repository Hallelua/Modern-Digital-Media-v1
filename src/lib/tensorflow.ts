import * as tf from '@tensorflow/tfjs';
import * as use from '@tensorflow-models/universal-sentence-encoder';

let model: any = null;

export const loadModel = async () => {
  if (!model) {
    model = await use.load();
  }
  return model;
};

export const compareAnswers = async (userAnswer: string, correctAnswer: string) => {
  const model = await loadModel();
  const sentences = [userAnswer.toLowerCase(), correctAnswer.toLowerCase()];
  const embeddings = await model.embed(sentences);
  
  const similarity = await tf.matMul(
    embeddings.slice([0, 0], [1]),
    embeddings.slice([1, 0], [1]), 
    false, 
    true
  ).data();
  
  return similarity[0] > 0.6; // Threshold for similarity
};