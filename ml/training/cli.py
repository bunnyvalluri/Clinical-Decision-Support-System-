"""
CLI Interface for training and evaluating clinical ML models.

Usage:
  python -m ml.training.cli --model SVM --version 1.0.0
  python -m ml.training.cli --model RANDOM_FOREST --version 1.0.0
  python -m ml.training.cli --model ADABOOST --version 1.0.0
  python -m ml.training.cli --train-all --version 1.0.0
"""
import argparse
import json
import logging
import sys

from ml.training.train import train_and_evaluate_model

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("ml.training.cli")


def main() -> None:
    parser = argparse.ArgumentParser(description="Clinical ML Model Training CLI")
    parser.add_argument(
        "--model",
        type=str,
        choices=["SVM", "RANDOM_FOREST", "ADABOOST"],
        help="Type of model to train.",
    )
    parser.add_argument(
        "--version",
        type=str,
        default="1.0.0",
        help="Model semantic version (default: 1.0.0).",
    )
    parser.add_argument(
        "--data-path",
        type=str,
        default=None,
        help="Path to training dataset CSV.",
    )
    parser.add_argument(
        "--train-all",
        action="store_true",
        help="Train all supported model types (SVM, Random Forest, AdaBoost).",
    )

    args = parser.parse_args()

    if not args.train_all and not args.model:
        parser.error("Either --model or --train-all must be specified.")

    models_to_train = (
        ["SVM", "RANDOM_FOREST", "ADABOOST"] if args.train_all else [args.model]
    )

    results = {}
    for model_type in models_to_train:
        logger.info("==================================================")
        logger.info("Training %s v%s...", model_type, args.version)
        try:
            res = train_and_evaluate_model(
                model_type=model_type,
                data_path=args.data_path,
                version=args.version,
            )
            results[model_type] = res
            logger.info(
                "Completed %s training. Accuracy: %.4f | Macro F1: %.4f | ROC-AUC: %s",
                model_type,
                res["metrics"]["accuracy"],
                res["metrics"]["f1_macro"],
                res["metrics"]["roc_auc"],
            )
        except Exception:
            logger.exception("Failed training for model %s", model_type)
            sys.exit(1)

    logger.info("==================================================")
    logger.info("All models trained and evaluated successfully.")
    print(json.dumps({k: v["metrics"] for k, v in results.items()}, indent=2))


if __name__ == "__main__":
    main()
