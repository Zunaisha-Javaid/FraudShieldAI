This directory stores trained model files after running the training scripts.

Files expected:
- xgboost_fraud.pkl       (XGBoost + LightGBM ensemble)
- bert_fraud/             (Fine-tuned BERT directory)
  - config.json
  - pytorch_model.bin
  - tokenizer_config.json
  - vocab.txt
- efficientnet_fraud.pth  (EfficientNet-B4 state dict)
- feature_columns.pkl     (Feature column names for XGBoost)

Run training scripts in ml/ directory to generate these files.
