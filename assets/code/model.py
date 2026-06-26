import torch
import torch.nn as nn


class EmotionCNN(nn.Module):
    def __init__(self):
        super(EmotionCNN, self).__init__()
        self.features = nn.Sequential(
            nn.Conv2d(1, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(),
            nn.MaxPool2d(2), # -> 24x24
            
            nn.Conv2d(64, 128, kernel_size=3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(),
            nn.MaxPool2d(2), # -> 12x12
            
            nn.Conv2d(128, 256, kernel_size=3, padding=1),
            nn.BatchNorm2d(256),
            nn.ReLU(),
            nn.MaxPool2d(2), # -> 6x6
            
            nn.Conv2d(256, 512, kernel_size=3, padding=1),
            nn.BatchNorm2d(512),
            nn.ReLU(),
            # 使用自适应平均池化，将其变为 1x1，极大地减少全连接层参数
            nn.AdaptiveAvgPool2d((1, 1)) 
        )

        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Dropout(0.4), # 只在最后全连接前使用一次适度 Dropout
            nn.Linear(512, 256),
            nn.BatchNorm1d(256), # 加入 BN 加速收敛
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(256, 7)
        )

    def forward(self, x):
        x = self.features(x)
        x = self.classifier(x)
        return x


# 运行看模型结构
if __name__ == "__main__":
    model = EmotionCNN()
    print(model)

    # 假输入测试
    dummy = torch.zeros(4, 1, 48, 48)   # 4张图
    output = model(dummy)
    print(f"\n输入形状: {dummy.shape}")
    print(f"输出形状: {output.shape}")  # 期望: [4, 7]